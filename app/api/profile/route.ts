import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getSignedPhotoUrl, isPhotoStorageConfigured } from '../../../lib/s3';
import { toAccountProfile } from '../../utils/profile.utils';
import type { AccountProfile, ProfileRow } from '../../types/profile.types';

export const runtime = 'nodejs';

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
    f.availability AS freelancer_availability
  FROM users u
  LEFT JOIN editors e ON e.user_id = u.id
  LEFT JOIN freelancers f ON f.user_id = u.id
  WHERE u.clerk_id = $1
`;

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
  const result = await db.query<ProfileRow>(PROFILE_SQL, [clerkId]);
  const row = result.rows[0];

  if (!row) return null;

  return toAccountProfile(row, await signedPhotoUrl(row.photo_key));
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
