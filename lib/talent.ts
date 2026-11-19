import { db } from './db';
import type { TalentClip, TalentFilterOptions, TalentFilters, TalentMember } from '../app/types/talent.types';
import { toRosterMember, type RosterRow } from '../app/utils/roster.utils';
import { TALENT_PAGE_SIZE } from '../app/utils/talent.utils';
import { isFreeNow } from '../app/utils/availability.utils';

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

  if (filters.beat) {
    const p = param(filters.beat);
    where.push(`(${p} = ANY(f.beats) OR ${p} = ANY(f.beat_tags))`);
  }

  if (filters.medium) where.push(`${param(filters.medium)} = ANY(f.work_mediums)`);
  if (filters.location) where.push(`f.location = ${param(filters.location)}`);
  // a timer that has run out no longer counts, even though its flag is still set
  if (filters.availableNow) {
    where.push('u.available_now = true AND (u.available_until IS NULL OR u.available_until > NOW())');
  }

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
    WHERE ${where.join('\n      AND ')}
    ORDER BY (u.available_now AND (u.available_until IS NULL OR u.available_until > NOW())) DESC NULLS LAST,
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
