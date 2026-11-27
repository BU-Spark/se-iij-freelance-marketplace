import { db } from './db';
import type { TalentClip, TalentFilterOptions, TalentFilters, TalentMember } from '../app/types/talent.types';
import { toRosterMember, type RosterRow } from '../app/utils/roster.utils';
import { TALENT_PAGE_SIZE } from '../app/utils/talent.utils';
import { isFreeNow } from '../app/utils/availability.utils';
import { PREFIX_BONUS, RELEVANCE_WEIGHTS } from '../app/utils/relevance.utils';

type TalentRow = RosterRow & {
  available_now: boolean | null;
  available_until: string | Date | null;
  short_bio: string | null;
  long_bio: string | null;
  community_covered: string | null;
  rate: string | null;
  tools: string[] | null;
  portfolio: unknown;
};

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const texts = (value: unknown) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

/** Links go straight into an href, so anything but http(s) (e.g. `javascript:`) is dropped */
const isWebLink = (value: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export function toClips(raw: unknown): TalentClip[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const clip = item as Record<string, unknown>;
    const url = text(clip.url);
    if (!isWebLink(url)) return [];
    return [
      {
        title: text(clip.title) || url,
        url,
        type: text(clip.type) || undefined,
        description: text(clip.description) || undefined,
      },
    ];
  });
}

function toTalentMember(row: TalentRow, now: Date): TalentMember {
  return {
    ...toRosterMember(row, now),
    mediums: texts(row.work_mediums),
    availableNow: isFreeNow(row.available_now === true, row.available_until, now),
    profile: {
      shortBio: text(row.short_bio),
      longBio: text(row.long_bio),
      communityCovered: text(row.community_covered),
      rate: text(row.rate),
      tools: texts(row.tools),
      portfolio: toClips(row.portfolio),
    },
  };
}

/** `%` and `_` are wildcards in LIKE; a search for "50%" should mean the literal text */
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (match) => `\\${match}`);

/**
 * One search word's contribution to a freelancer's relevance, summed over every field it can be
 * found in. The weights are the shared ones, so the same search ranks the same here and on the desk.
 */
function wordScoreSql(wordsParam: string): string {
  const contains = (field: string) => `strpos(lower(${field}), w.word) > 0`;
  const anyContains = (array: string) =>
    `EXISTS (SELECT 1 FROM unnest(${array}) AS entry(name) WHERE strpos(lower(entry.name), w.word) > 0)`;
  const anyStarts = (array: string) =>
    `EXISTS (SELECT 1 FROM unnest(${array}) AS entry(name) WHERE starts_with(lower(entry.name), w.word))`;

  const terms: [string, number][] = [
    [contains(`concat_ws(' ', u.first_name, u.last_name)`), RELEVANCE_WEIGHTS.name],
    [anyContains('f.beats'), RELEVANCE_WEIGHTS.beat],
    [anyContains('f.beat_tags'), RELEVANCE_WEIGHTS.tag],
    [anyContains('f.work_mediums'), RELEVANCE_WEIGHTS.medium],
    [contains(`coalesce(f.location, '')`), RELEVANCE_WEIGHTS.location],
    [contains(`coalesce(f.community_covered, '')`), RELEVANCE_WEIGHTS.community],
    [contains(`concat_ws(' ', u.short_bio, u.long_bio)`), RELEVANCE_WEIGHTS.bio],
    // a word that starts a value says more than one buried in the middle of it
    [`starts_with(lower(concat_ws(' ', u.first_name, u.last_name)), w.word)`, PREFIX_BONUS],
    [anyStarts('f.beats'), PREFIX_BONUS],
    [anyStarts('f.beat_tags'), PREFIX_BONUS],
    [anyStarts('f.work_mediums'), PREFIX_BONUS],
    [`starts_with(lower(coalesce(f.location, '')), w.word)`, PREFIX_BONUS],
  ];

  const sum = terms
    .map(([condition, weight]) => `CASE WHEN ${condition} THEN ${weight} ELSE 0 END`)
    .join('\n             + ');

  return `SELECT COALESCE(SUM(${sum}), 0) AS text_score
              FROM unnest(${wordsParam}::text[]) AS w(word)`;
}

export function buildTalentQuery(filters: TalentFilters): { sql: string; params: unknown[] } {
  const where = ["'freelancer' = ANY(u.roles)"];
  const params: unknown[] = [];
  const param = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  const q = filters.q?.trim();
  if (q) {
    const p = param(`%${escapeLike(q)}%`);
    where.push(`(
      (u.first_name || ' ' || u.last_name) ILIKE ${p}
      OR f.location ILIKE ${p}
      OR f.community_covered ILIKE ${p}
      OR u.short_bio ILIKE ${p}
      OR array_to_string(f.beats || f.beat_tags || f.work_mediums, ' ') ILIKE ${p}
    )`);
  }

  let beatParam: string | null = null;
  if (filters.beat) {
    beatParam = param(filters.beat);
    where.push(`(${beatParam} = ANY(f.beats) OR ${beatParam} = ANY(f.beat_tags))`);
  }

  if (filters.medium) where.push(`${param(filters.medium)} = ANY(f.work_mediums)`);
  if (filters.location) where.push(`f.location = ${param(filters.location)}`);
  // a timer that has run out no longer counts, even though its flag is still set
  if (filters.availableNow) {
    where.push('u.available_now = true AND (u.available_until IS NULL OR u.available_until > NOW())');
  }

  // Scored in SQL rather than after the fact, so the row cap keeps the best matches, not the first
  const wordsParam = q ? param(q.toLowerCase().split(/\s+/).filter(Boolean)) : null;
  const score = [
    wordsParam ? 'COALESCE(relevance.text_score, 0)' : '',
    // a headline beat is a stronger match than a beat the person only tagged
    beatParam
      ? `CASE WHEN ${beatParam} = ANY(f.beats) THEN ${RELEVANCE_WEIGHTS.filterBeat}
              WHEN ${beatParam} = ANY(f.beat_tags) THEN ${RELEVANCE_WEIGHTS.filterBeatTag}
              ELSE 0 END`
      : '',
  ]
    .filter(Boolean)
    .join(' + ');

  const sql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.available_now,
      u.available_until,
      u.short_bio,
      u.long_bio,
      f.location,
      f.community_covered,
      f.rate,
      f.beats,
      f.beat_tags,
      f.work_mediums,
      f.tools,
      f.portfolio,
      f.availability
    FROM users u
    JOIN freelancers f ON f.user_id = u.id
    ${wordsParam ? `LEFT JOIN LATERAL (${wordScoreSql(wordsParam)}) relevance ON TRUE` : ''}
    WHERE ${where.join('\n      AND ')}
    ORDER BY ${score ? `(${score}) DESC,\n             ` : ''}(u.available_now AND (u.available_until IS NULL OR u.available_until > NOW())) DESC NULLS LAST,
             u.first_name,
             u.last_name
    LIMIT ${param(TALENT_PAGE_SIZE)}
  `;

  return { sql, params };
}

export async function searchTalent(filters: TalentFilters, now: Date = new Date()): Promise<TalentMember[]> {
  const { sql, params } = buildTalentQuery(filters);
  const { rows } = await db.query<TalentRow>(sql, params);

  return rows.map((row) => toTalentMember(row, now));
}

const SELECT_OPTIONS = `
  SELECT
    ARRAY(
      SELECT DISTINCT b FROM freelancers f2
      JOIN users u2 ON u2.id = f2.user_id AND 'freelancer' = ANY(u2.roles)
      CROSS JOIN LATERAL unnest(f2.beats || f2.beat_tags) AS b
      WHERE b <> '' ORDER BY b
    ) AS beats,
    ARRAY(
      SELECT DISTINCT m FROM freelancers f2
      JOIN users u2 ON u2.id = f2.user_id AND 'freelancer' = ANY(u2.roles)
      CROSS JOIN LATERAL unnest(f2.work_mediums) AS m
      WHERE m <> '' ORDER BY m
    ) AS mediums,
    ARRAY(
      SELECT DISTINCT f2.location FROM freelancers f2
      JOIN users u2 ON u2.id = f2.user_id AND 'freelancer' = ANY(u2.roles)
      WHERE COALESCE(f2.location, '') <> '' ORDER BY f2.location
    ) AS locations
`;

export async function listTalentFilterOptions(): Promise<TalentFilterOptions> {
  const { rows } = await db.query<TalentFilterOptions>(SELECT_OPTIONS);
  const row = rows[0];
  return { beats: row?.beats ?? [], mediums: row?.mediums ?? [], locations: row?.locations ?? [] };
}
