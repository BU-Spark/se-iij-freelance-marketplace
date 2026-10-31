import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import type { NewEditor, NewFreelancer, NewUser, OnboardingRole } from '../../types/onboarding.types';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';

const isRole = (value: unknown): value is OnboardingRole => value === 'editor' || value === 'freelancer';

/** A non-empty, duplicate-free list of known roles */
const isRoleList = (value: unknown): value is OnboardingRole[] =>
  Array.isArray(value) && value.length > 0 && value.every(isRole) && new Set(value).size === value.length;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isUser = (value: unknown): value is NewUser => isRecord(value) && typeof value.email === 'string';

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to save onboarding.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The onboarding payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body) || !isRoleList(body.roles) || !isUser(body.user)) {
    return NextResponse.json({ error: 'The onboarding payload is invalid.' }, { status: 400 });
  }

  const roles = body.roles;
  const user = body.user;
  const editor = roles.includes('editor') ? body.editor : undefined;
  const freelancer = roles.includes('freelancer') ? body.freelancer : undefined;

  // Every selected role has to arrive with its profile
  if (!isRecord(editor) && roles.includes('editor')) {
    return NextResponse.json({ error: 'The onboarding payload is invalid.' }, { status: 400 });
  }
  if (!isRecord(freelancer) && roles.includes('freelancer')) {
    return NextResponse.json({ error: 'The onboarding payload is invalid.' }, { status: 400 });
  }

  let client: PoolClient | undefined;

  try {
    client = await db.connect();
    const connection = client;
    await connection.query('BEGIN');
    const userResult = await connection.query<{ id: string }>(
      `INSERT INTO users (clerk_id, email, first_name, last_name, short_bio, long_bio, preferences, roles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (clerk_id) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         short_bio = EXCLUDED.short_bio,
         long_bio = EXCLUDED.long_bio,
         preferences = EXCLUDED.preferences,
         roles = EXCLUDED.roles,
         updated_at = NOW()
       RETURNING id`,
      [
        userId,
        user.email,
        user.firstName ?? '',
        user.lastName ?? '',
        user.shortBio ?? null,
        user.longBio ?? null,
        JSON.stringify(user.preferences ?? {}),
        roles,
      ]
    );
    const databaseUserId = userResult.rows[0]?.id;

    if (!databaseUserId) {
      throw new Error('The database did not return the saved user.');
    }

    // A role the user unchecked keeps its row, so their answers are there if they pick it again
    if (roles.includes('editor')) {
      const details = editor as NewEditor;
      await connection.query(
        `INSERT INTO editors
           (user_id, organization_id, desks, job_title, years_at_desk, location, pitch_preferences, availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           organization_id = EXCLUDED.organization_id,
           desks = EXCLUDED.desks,
           job_title = EXCLUDED.job_title,
           years_at_desk = EXCLUDED.years_at_desk,
           location = EXCLUDED.location,
           pitch_preferences = EXCLUDED.pitch_preferences,
           availability = EXCLUDED.availability,
           updated_at = NOW()`,
        [
          databaseUserId,
          details.organizationId ?? null,
          details.desks,
          details.jobTitle,
          details.yearsAtDesk,
          details.location ?? null,
          JSON.stringify(details.pitchPreferences),
          details.availability ? JSON.stringify(details.availability) : null,
        ]
      );
    }

    if (roles.includes('freelancer')) {
      const details = freelancer as NewFreelancer;
      await connection.query(
        `INSERT INTO freelancers
           (user_id, location, rate, community_covered, reporting_beats, beat_tags, work_mediums, tools, portfolio, availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (user_id) DO UPDATE SET
           location = EXCLUDED.location,
           rate = EXCLUDED.rate,
           community_covered = EXCLUDED.community_covered,
           reporting_beats = EXCLUDED.reporting_beats,
           beat_tags = EXCLUDED.beat_tags,
           work_mediums = EXCLUDED.work_mediums,
           tools = EXCLUDED.tools,
           portfolio = EXCLUDED.portfolio,
           availability = EXCLUDED.availability,
           updated_at = NOW()`,
        [
          databaseUserId,
          details.location ?? null,
          details.rate ?? null,
          details.communityCovered ?? null,
          details.reportingBeats ?? [],
          details.beatTags ?? [],
          details.workMediums ?? [],
          details.tools ?? [],
          JSON.stringify(details.portfolio ?? []),
          details.availability ? JSON.stringify(details.availability) : null,
        ]
      );
    }

    await connection.query('COMMIT');
    return NextResponse.json({ saved: true, roles });
  } catch (error) {
    await client?.query('ROLLBACK');
    console.error('Failed to save onboarding profile.', error);
    return NextResponse.json({ error: 'Unable to save your profile right now.' }, { status: 500 });
  } finally {
    client?.release();
  }
}
