import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { addBeat, MAX_BEAT_NAME_LENGTH } from '../../../../lib/beats';
import { isSignedInUserAdmin } from '../../../../lib/auth';
import { BEAT_OTHER } from '../../../onboarding/constants';

export const runtime = 'nodejs';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Adds a beat to the onboarding picker. Middleware guards the /admin pages, not /api, so the team
 * check lives here and fails closed.
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to add a beat.' }, { status: 401 });
  }

  try {
    if (!(await isSignedInUserAdmin())) {
      return NextResponse.json({ error: 'Only the Story Match team can add beats.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Could not check whether this person may add beats.', error);
    return NextResponse.json({ error: 'Only the Story Match team can add beats.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The beat is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Add a beat name.' }, { status: 400 });
  }

  const name = body.name.trim();

  if (!name) {
    return NextResponse.json({ error: 'Add a beat name.' }, { status: 400 });
  }

  if (name.length > MAX_BEAT_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Keep the beat name under ${MAX_BEAT_NAME_LENGTH} characters.` },
      { status: 400 }
    );
  }

  // "Other" is the chip that reveals the free-text field, so it is not an ordinary beat
  if (name.toLowerCase() === BEAT_OTHER.toLowerCase()) {
    return NextResponse.json({ error: 'That name is reserved for the "Other" option.' }, { status: 400 });
  }

  try {
    const result = await addBeat(name);

    if (result.status === 'exists') {
      return NextResponse.json({ error: 'That beat is already on the list.' }, { status: 409 });
    }

    return NextResponse.json({ beat: result.beat }, { status: 201 });
  } catch (error) {
    console.error('Failed to add a beat.', error);
    return NextResponse.json({ error: 'Unable to add this beat right now.' }, { status: 500 });
  }
}
