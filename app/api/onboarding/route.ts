import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import type { NewEditor, NewFreelancer, OnboardingPayload } from '../../types/onboarding.types';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';

const isRole = (role: unknown): role is OnboardingPayload['role'] => role === 'editor' || role === 'freelancer';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isProfile = (value: unknown): value is NewEditor | NewFreelancer => isRecord(value) && isRecord(value.user);

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

  if (!isRecord(body) || !isRole(body.role) || !isProfile(body.profile)) {
    return NextResponse.json({ error: 'The onboarding payload is invalid.' }, { status: 400 });
  }

  const profile = body.profile;
  const user = profile.user;
  let client: PoolClient | undefined;

  try {
    client = await db.connect();
    const connection = client;
    await connection.query('BEGIN');
    const userResult = await connection.query<{ id: string }>(
      `INSERT INTO users (clerk_id, username, email, first_name, last_name, short_bio, roles)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (clerk_id) DO UPDATE SET
         username = EXCLUDED.username,
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         short_bio = EXCLUDED.short_bio,
         roles = EXCLUDED.roles,
         updated_at = NOW()
       RETURNING id`,
      [
        userId,
        user.email,
        user.email,
        user.firstName,
        user.lastName,
        user.shortBio ?? null,
        user.roles.map((role) => role.toString()),
      ]
    );
    const databaseUserId = userResult.rows[0]?.id;

    if (!databaseUserId) {
      throw new Error('The database did not return the saved user.');
    }

    if (body.role === 'editor') {
      const editor = profile as NewEditor;
      await connection.query(
        `INSERT INTO editors (user_id, organization_id, desks, job_title, years_at_desk, pitch_preferences)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           organization_id = EXCLUDED.organization_id,
           desks = EXCLUDED.desks,
           job_title = EXCLUDED.job_title,
           years_at_desk = EXCLUDED.years_at_desk,
           pitch_preferences = EXCLUDED.pitch_preferences,
           updated_at = NOW()`,
        [
          databaseUserId,
          editor.organizationId ?? null,
          editor.desks,
          editor.jobTitle,
          editor.yearsAtDesk,
          JSON.stringify(editor.pitchPreferences),
        ]
      );
    } else {
      const freelancer = profile as NewFreelancer;
      await connection.query(
        `INSERT INTO freelancers (user_id, location, reporting_beats, work_mediums, tools, portfolio)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           location = EXCLUDED.location,
           reporting_beats = EXCLUDED.reporting_beats,
           work_mediums = EXCLUDED.work_mediums,
           tools = EXCLUDED.tools,
           portfolio = EXCLUDED.portfolio,
           updated_at = NOW()`,
        [
          databaseUserId,
          freelancer.location ?? null,
          freelancer.reportingBeats ?? [],
          freelancer.workMediums ?? [],
          freelancer.tools ?? [],
          JSON.stringify(freelancer.portfolio ?? []),
        ]
      );
    }

    await connection.query('COMMIT');
    return NextResponse.json({ saved: true });
  } catch (error) {
    await client?.query('ROLLBACK');
    console.error('Failed to save onboarding profile.', error);
    return NextResponse.json({ error: 'Unable to save your profile right now.' }, { status: 500 });
  } finally {
    client?.release();
  }
}
