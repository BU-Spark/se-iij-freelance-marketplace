import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { removeBeat } from '../../../../../lib/beats';
import { isSignedInUserAdmin } from '../../../../../lib/auth';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const refuse = (error: string, status: number) => NextResponse.json({ error }, { status });

/**
 * Middleware guards the /admin pages, not /api, so every handler checks the team here and fails
 * closed. Returns the response to send when the caller may not change the beats.
 */
async function teamOnly(): Promise<NextResponse | null> {
  const { userId } = await auth();

  if (!userId) {
    return refuse('You must be signed in to change the beats.', 401);
  }

  try {
    if (!(await isSignedInUserAdmin())) {
      return refuse('Only the Story Match team can change the beats.', 403);
    }
  } catch (error) {
    console.error('Could not check whether this person may change the beats.', error);
    return refuse('Only the Story Match team can change the beats.', 403);
  }

  return null;
}

/**
 * Takes a beat out of the onboarding picker. Profile rows keep the names they already stored, so
 * this only changes what new freelancers are offered.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const denied = await teamOnly();
  if (denied) return denied;

  const { id } = await params;

  try {
    const removed = await removeBeat(id);

    if (!removed) {
      return refuse('Beat not found.', 404);
    }

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error('Failed to remove a beat.', error);
    return refuse('Unable to remove this beat right now.', 500);
  }
}
