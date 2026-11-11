import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { loadProfileRow } from '../../../lib/profile';
import { getSignedPhotoUrl, isPhotoStorageConfigured } from '../../../lib/s3';
import {
  cleanBasic,
  cleanEditorFacts,
  cleanFreelancerFacts,
  toAccountProfile,
  validateBasic,
} from '../../utils/profile.utils';
import type { AccountProfile, ProfileRole } from '../../types/profile.types';

export const runtime = 'nodejs';

const isRole = (value: unknown): value is ProfileRole => value === 'editor' || value === 'freelancer';
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The bucket is private, so the panel needs a signed URL rather than the stored key */
async function signedPhotoUrl(key: string | null): Promise<string | undefined> {
  if (!key || !isPhotoStorageConfigured()) return undefined;
  try {
    return await getSignedPhotoUrl(key);
  } catch (error) {
    console.error('Could not sign the profile photo URL.', error);
    return undefined;
  }
}

async function loadProfile(clerkId: string): Promise<AccountProfile | null> {
  const row = await loadProfileRow(clerkId);
  if (!row) return null;
  return toAccountProfile(row, await signedPhotoUrl(row.photo_key));
}

/** Adds the role to users.roles if it isn't there yet; rejects when there is no user row */
async function addRoleToUser(
  query: (sql: string, values: unknown[]) => Promise<unknown>,
  clerkId: string,
  role: ProfileRole
) {
  const updated = (await query(
    `UPDATE users
       SET roles = array_append(roles, $2),
           updated_at = NOW()
     WHERE clerk_id = $1
       AND NOT ($2 = ANY(roles))
     RETURNING id`,
    [clerkId, role]
  )) as { rowCount: number | null };

  if (updated.rowCount) return true;

  const existing = (await query('SELECT 1 FROM users WHERE clerk_id = $1', [clerkId])) as { rowCount: number | null };
  return Boolean(existing.rowCount);
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to view your profile.' }, { status: 401 });
  }

  try {
    const profile = await loadProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'No profile yet. Finish onboarding to create one.' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to load the profile.', error);
    return NextResponse.json({ error: 'Unable to load your profile right now.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to change your profile.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The profile payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The profile payload is invalid.' }, { status: 400 });
  }

  const section = body.section;
  let client;
  let notFound = false;

  try {
    client = await db.connect();
    const connection = client;
    await connection.query('BEGIN');

    if (section === 'basic') {
      if (!isRecord(body.basic)) {
        await connection.query('ROLLBACK');
        return NextResponse.json({ error: 'The profile payload is invalid.' }, { status: 400 });
      }

      const basic = cleanBasic(body.basic);

      const problems = validateBasic(basic);
      const firstProblem = Object.values(problems)[0];

      if (firstProblem) {
        await connection.query('ROLLBACK');
        return NextResponse.json({ error: firstProblem }, { status: 400 });
      }

      const updated = await connection.query(
        `UPDATE users
           SET first_name = $2,
               last_name = $3,
               email = $4,
               short_bio = $5,
               long_bio = $6,
               updated_at = NOW()
         WHERE clerk_id = $1
         RETURNING id`,
        [userId, basic.firstName, basic.lastName, basic.email, basic.shortBio, basic.longBio]
      );

      notFound = updated.rowCount === 0;
    } else if (section === 'role') {
      const role = body.role;
      if (!isRole(role) || !isRecord(body.facts)) {
        await connection.query('ROLLBACK');
        return NextResponse.json({ error: 'The profile payload is invalid.' }, { status: 400 });
      }

      const cleaned = role === 'editor' ? cleanEditorFacts(body.facts) : cleanFreelancerFacts(body.facts);

      if (!cleaned.ok) {
        await connection.query('ROLLBACK');
        return NextResponse.json({ error: cleaned.error }, { status: 400 });
      }

      if (cleaned.role === 'editor') {
        const editor = cleaned.value;
        await connection.query(
          `INSERT INTO editors
             (user_id, organization_id, desks, job_title, years_at_desk, location, pitch_preferences)
           SELECT u.id, $2, $3::text[], $4, $5, $6, $7::jsonb
           FROM users u
           WHERE u.clerk_id = $1
           ON CONFLICT (user_id) DO UPDATE SET
             organization_id = EXCLUDED.organization_id,
             desks = EXCLUDED.desks,
             job_title = EXCLUDED.job_title,
             years_at_desk = EXCLUDED.years_at_desk,
             location = EXCLUDED.location,
             pitch_preferences = EXCLUDED.pitch_preferences,
             updated_at = NOW()`,
          [
            userId,
            editor.organizationId,
            editor.desks,
            editor.jobTitle,
            editor.yearsAtDesk,
            editor.location,
            JSON.stringify({
              preferredPitchFormat: editor.preferredPitchFormat,
              averageResponseTime: editor.averageResponseTime,
              interestedTopics: editor.interestedTopics,
              editorialPreferences: editor.editorialPreferences,
              lookingFor: editor.lookingFor,
            }),
          ]
        );
      } else {
        const freelancer = cleaned.value;
        await connection.query(
          `INSERT INTO freelancers
             (user_id, location, rate, community_covered, beats, beat_other, skills, beat_tags, work_mediums, tools)
           SELECT u.id, $2, $3, $4, $5::text[], $6, $7::text[], $8::text[], $9::text[], $10::text[]
           FROM users u
           WHERE u.clerk_id = $1
           ON CONFLICT (user_id) DO UPDATE SET
             location = EXCLUDED.location,
             rate = EXCLUDED.rate,
             community_covered = EXCLUDED.community_covered,
             beats = EXCLUDED.beats,
             beat_other = EXCLUDED.beat_other,
             skills = EXCLUDED.skills,
             beat_tags = EXCLUDED.beat_tags,
             work_mediums = EXCLUDED.work_mediums,
             tools = EXCLUDED.tools,
             updated_at = NOW()`,
          [
            userId,
            freelancer.location,
            freelancer.rate,
            freelancer.communityCovered,
            freelancer.reportingBeats,
            freelancer.beatOther,
            freelancer.skills,
            freelancer.beatTags,
            freelancer.workMediums,
            freelancer.tools,
          ]
        );
      }

      notFound = !(await addRoleToUser((sql, values) => connection.query(sql, values), userId, role));
    } else if (section === 'availableNow') {
      if (typeof body.availableNow !== 'boolean') {
        await connection.query('ROLLBACK');
        return NextResponse.json({ error: 'The profile payload is invalid.' }, { status: 400 });
      }

      // one flag on the person, so it is a single update rather than a role upsert
      const updated = await connection.query(
        `UPDATE users
           SET available_now = $2,
               updated_at = NOW()
         WHERE clerk_id = $1
         RETURNING id`,
        [userId, body.availableNow]
      );

      notFound = updated.rowCount === 0;
    } else {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: 'The profile payload is invalid.' }, { status: 400 });
    }

    if (notFound) {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: 'No profile yet. Finish onboarding to create one.' }, { status: 404 });
    }

    await connection.query('COMMIT');
  } catch (error) {
    await client?.query('ROLLBACK');
    console.error('Failed to save the profile.', error);
    return NextResponse.json({ error: 'Unable to save your profile right now.' }, { status: 500 });
  } finally {
    client?.release();
  }

  try {
    const profile = await loadProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'No profile yet. Finish onboarding to create one.' }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to reload the profile after saving.', error);
    return NextResponse.json({ error: 'Unable to load your profile right now.' }, { status: 500 });
  }
}
