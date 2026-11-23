import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadProfileRoles } from '../../../../lib/profile';
import { inviteFreelancers } from '../../../../lib/roster';
import type { ProfileRole } from '../../../../app/types/profile.types';

export const runtime = 'nodejs';

/** A roster is an editor's shortlist, not a bulk import */
const MAX_INVITES = 50;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Saves freelancers to the signed-in editor's roster. `/api` is outside the middleware matcher, so
 * the editor check happens here rather than being assumed. Saving is immediate; `notify` only
 * decides whether the freelancer is told about it.
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to invite freelancers.' }, { status: 401 });
  }

  let roles: ProfileRole[];
  try {
    roles = await loadProfileRoles(userId);
  } catch (error) {
    console.error('Could not check whether this person has a roster.', error);
    return NextResponse.json({ error: 'Unable to add to your roster right now.' }, { status: 500 });
  }

  if (!roles.includes('editor')) {
    return NextResponse.json({ error: 'Only editors have a roster.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The invite is not valid JSON.' }, { status: 400 });
  }

  const freelancerIds = (body as { freelancerIds?: unknown } | null)?.freelancerIds;
  const notify = (body as { notify?: unknown } | null)?.notify === true;

  if (!Array.isArray(freelancerIds) || freelancerIds.length === 0) {
    return NextResponse.json({ error: 'Choose at least one freelancer to save.' }, { status: 400 });
  }

  if (freelancerIds.length > MAX_INVITES) {
    return NextResponse.json({ error: `Save at most ${MAX_INVITES} freelancers at a time.` }, { status: 400 });
  }

  if (!freelancerIds.every((id) => typeof id === 'string' && UUID.test(id))) {
    return NextResponse.json({ error: 'One of those freelancers is not a valid account.' }, { status: 400 });
  }

  try {
    const result = await inviteFreelancers(userId, freelancerIds, notify);

    // No `users` row yet: the page would not have offered a roster either
    if (!result) {
      return NextResponse.json(
        { error: 'Finish onboarding before saving freelancers.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    return NextResponse.json({ saved: result.saved });
  } catch (error) {
    console.error('Failed to save freelancers to a roster.', error);
    return NextResponse.json({ error: 'Unable to add to your roster right now.' }, { status: 500 });
  }
}
