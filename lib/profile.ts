import { db } from './db';
import { profileRoles } from '../app/utils/profile.utils';
import type { ProfileRole, ProfileRow } from '../app/types/profile.types';

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
    u.available_now,
    u.available_until,
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
    f.beats,
    f.beat_other,
    f.skills,
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

/**
 * True once onboarding has written the signed-in user's row *with a role*. A bare row — the one
 * `ensureBasicUser` writes for admins — holds no roles, so it must not count as finished
 * onboarding, or an account that lost its admin flag would land on a desk it never set up.
 */
export async function hasProfile(clerkId: string): Promise<boolean> {
  const result = await db.query(
    `SELECT 1
       FROM users
      WHERE clerk_id = $1
        AND cardinality(roles) > 0`,
    [clerkId]
  );
  return Boolean(result.rowCount);
}

/**
 * Admins skip onboarding, so their row is only the basics Clerk already knows: name and email.
 * `roles` stays empty (the check constraint only allows editor/freelancer) and an existing row,
 * including a real profile, is never overwritten.
 */
export async function ensureBasicUser(
  clerkId: string,
  details: { email: string; firstName?: string; lastName?: string }
): Promise<void> {
  await db.query(
    `INSERT INTO users (clerk_id, email, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_id) DO NOTHING`,
    [clerkId, details.email, details.firstName ?? '', details.lastName ?? '']
  );
}

export async function loadProfileRow(clerkId: string): Promise<ProfileRow | null> {
  const result = await db.query<ProfileRow>(PROFILE_SQL, [clerkId]);
  return result.rows[0] ?? null;
}

/** The roles this person actually holds, used to decide which workspaces they may open */
export async function loadProfileRoles(clerkId: string): Promise<ProfileRole[]> {
  const row = await loadProfileRow(clerkId);
  return row ? profileRoles(row) : [];
}
