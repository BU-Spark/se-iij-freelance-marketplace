import { db } from './db';
import type { RosterMember } from '../app/types/dashboard.types';
import { toRosterMember, type RosterRow } from '../app/utils/roster.utils';

/**
 * Every freelancer who has finished onboarding, with the answers the roster card shows.
 * The roles check matters because a role row outlives the role being unticked.
 */
const SELECT_FREELANCERS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    f.location,
    f.reporting_beats,
    f.beat_tags,
    f.work_mediums,
    f.availability
  FROM users u
  JOIN freelancers f ON f.user_id = u.id
  WHERE 'freelancer' = ANY(u.roles)
  ORDER BY u.first_name, u.last_name
`;

export async function listRoster(now: Date = new Date()): Promise<RosterMember[]> {
  const { rows } = await db.query<RosterRow>(SELECT_FREELANCERS);
  return rows.map((row) => toRosterMember(row, now));
}
