import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadProfileRow } from '../../../../lib/profile';
import { profileRoles, toOnboardingData } from '../../../utils/profile.utils';

export const runtime = 'nodejs';

/**
 * The saved profile in onboarding's own shape, so the flow can reopen on it.
 * Used when someone adds their second role from the profile panel: they should be able to
 * finish that role without retyping — or overwriting — what is already stored.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to view your profile.' }, { status: 401 });
  }

  try {
    const row = await loadProfileRow(userId);

    if (!row) {
      return NextResponse.json({ error: 'No profile yet. Finish onboarding to create one.' }, { status: 404 });
    }

    return NextResponse.json({ roles: profileRoles(row), data: toOnboardingData(row) });
  } catch (error) {
    console.error('Failed to load the onboarding seed.', error);
    return NextResponse.json({ error: 'Unable to load your profile right now.' }, { status: 500 });
  }
}
