import { db } from './db';
import type { ProfileRow } from '../app/types/profile.types';

/**
 * Everything the profile screen and the onboarding seed need, in one row.
 * `u.preferences` and `f.portfolio` are here for the seed; the panel ignores them.
 */
const PROFILE_SQL = `
  SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.short_bio,
    u.long_bio,
    u.photo_key,
    u.roles,
    u.preferences,
    e.user_id AS editor_id,
    e.organization_id,
    e.desks,
    e.job_title,
    e.years_at_desk,
    e.location AS editor_location,
    e.pitch_preferences,
    e.availability AS editor_availability,
    f.user_id AS freelancer_id,
    f.location AS freelancer_location,
    f.rate,
    f.community_covered,
    f.reporting_beats,
    f.beat_tags,
    f.work_mediums,
    f.tools,
    f.portfolio,
    f.availability AS freelancer_availability
  FROM users u
  LEFT JOIN editors e ON e.user_id = u.id
  LEFT JOIN freelancers f ON f.user_id = u.id
  WHERE u.clerk_id = $1
`;

/** True once onboarding has written the signed-in user's row */
export async function hasProfile(clerkId: string): Promise<boolean> {
  const result = await db.query('SELECT 1 FROM users WHERE clerk_id = $1', [clerkId]);
  return Boolean(result.rowCount);
}

export async function loadProfileRow(clerkId: string): Promise<ProfileRow | null> {
  const result = await db.query<ProfileRow>(PROFILE_SQL, [clerkId]);
  return result.rows[0] ?? null;
}
