import type { TalentFilters } from '../app/types/talent.types';
import { TALENT_PAGE_SIZE } from '../app/utils/talent.utils';

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
      OR array_to_string(f.reporting_beats || f.beat_tags || f.work_mediums, ' ') ILIKE ${p}
    )`);
  }

  if (filters.beat) {
    const p = param(filters.beat);
    where.push(`(${p} = ANY(f.reporting_beats) OR ${p} = ANY(f.beat_tags))`);
  }

  if (filters.medium) where.push(`${param(filters.medium)} = ANY(f.work_mediums)`);
  if (filters.location) where.push(`f.location = ${param(filters.location)}`);
  if (filters.availableNow) where.push('u.available_now = true');

  const sql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.available_now,
      u.short_bio,
      u.long_bio,
      f.location,
      f.community_covered,
      f.rate,
      f.reporting_beats,
      f.beat_tags,
      f.work_mediums,
      f.tools,
      f.portfolio,
      f.availability
    FROM users u
    JOIN freelancers f ON f.user_id = u.id
    WHERE ${where.join('\n      AND ')}
    ORDER BY u.available_now DESC NULLS LAST, u.first_name, u.last_name
    LIMIT ${param(TALENT_PAGE_SIZE)}
  `;

  return { sql, params };
}
