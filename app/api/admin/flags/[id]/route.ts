import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { setFlagStatus } from '../../../../../lib/flags';
import { isSignedInUserAdmin } from '../../../../../lib/auth';
import type { FlagStatus } from '../../../../types/admin.types';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES: FlagStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];

const isStatus = (value: unknown): value is FlagStatus =>
  typeof value === 'string' && STATUSES.includes(value as FlagStatus);

/**
 * Moves a flag along the team's queue. Middleware guards the /admin pages, not /api, so the team
 * check lives here and fails closed.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to change a flag.' }, { status: 401 });
  }

  try {
    if (!(await isSignedInUserAdmin())) {
      return NextResponse.json({ error: 'Only the Story Match team can change flags.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Could not check whether this person may change flags.', error);
    return NextResponse.json({ error: 'Only the Story Match team can change flags.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The flag update is not valid JSON.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'The flag update is invalid.' }, { status: 400 });
  }

  const { status } = body as { status?: unknown };

  if (!isStatus(status)) {
    return NextResponse.json({ error: 'Choose a valid flag status.' }, { status: 400 });
  }

  const { id } = await params;

  try {
    const flag = await setFlagStatus(id, status);

    if (!flag) {
      return NextResponse.json({ error: 'Flag not found.' }, { status: 404 });
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Failed to change a flag.', error);
    return NextResponse.json({ error: 'Unable to update this flag right now.' }, { status: 500 });
  }
}
