import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadProfileRoles } from '../../../../../lib/profile';
import { removeFromRoster, respondToInvite } from '../../../../../lib/roster';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Takes one freelancer off the signed-in editor's roster. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to change your roster.' }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'That freelancer is not a valid account.' }, { status: 400 });
  }

  try {
    if (!(await loadProfileRoles(userId)).includes('editor')) {
      return NextResponse.json({ error: 'Only editors have a roster.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Could not check whether this person has a roster.', error);
    return NextResponse.json({ error: 'Unable to change your roster right now.' }, { status: 500 });
  }

  try {
    const removed = await removeFromRoster(userId, id);

    if (removed === null) {
      return NextResponse.json(
        { error: 'Finish onboarding before changing your roster.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    if (!removed) {
      return NextResponse.json({ error: 'That freelancer is not on your roster.' }, { status: 404 });
    }

    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error('Failed to remove a freelancer from a roster.', error);
    return NextResponse.json({ error: 'Unable to change your roster right now.' }, { status: 500 });
  }
}

/**
 * Answers the optional notification. The id is the *editor's* account, seen from the freelancer's
 * side, mirroring how DELETE names the freelancer for the editor. The answer does not change the
 * editor's roster: the favorite was saved before the freelancer was ever told.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to answer a notification.' }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'That editor is not a valid account.' }, { status: 400 });
  }

  try {
    if (!(await loadProfileRoles(userId)).includes('freelancer')) {
      return NextResponse.json({ error: 'Only freelancers can answer a notification.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Could not check whether this person can answer notifications.', error);
    return NextResponse.json({ error: 'Unable to answer the notification right now.' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The answer is not valid JSON.' }, { status: 400 });
  }

  const response = (body as { response?: unknown } | null)?.response;

  if (response !== 'accepted' && response !== 'declined') {
    return NextResponse.json({ error: 'Say whether you accept or decline the notification.' }, { status: 400 });
  }

  try {
    const answered = await respondToInvite(userId, id, response);

    if (answered === null) {
      return NextResponse.json(
        { error: 'Finish onboarding before answering notifications.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    if (!answered) {
      return NextResponse.json({ error: 'There is no notification waiting from that editor.' }, { status: 404 });
    }

    return NextResponse.json({ status: response });
  } catch (error) {
    console.error('Failed to answer a roster notification.', error);
    return NextResponse.json({ error: 'Unable to answer the notification right now.' }, { status: 500 });
  }
}
