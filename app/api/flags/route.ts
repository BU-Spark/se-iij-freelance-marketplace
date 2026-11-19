import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { submitFlag } from '../../../lib/flags';
import { isRecord } from '../../utils/assignment.utils';
import type { FlagTarget } from '../../types/admin.types';

export const runtime = 'nodejs';

const MAX_REASON_LENGTH = 500;
const TARGETS: FlagTarget[] = ['account', 'assignment', 'pitch'];

const isTarget = (value: unknown): value is FlagTarget =>
  typeof value === 'string' && TARGETS.includes(value as FlagTarget);

/**
 * Takes a flag from a signed-in person. The reporter is read from the session, and the target label
 * is looked up by the data layer, so neither can be spoofed from the client.
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to report something.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The report is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The report is invalid.' }, { status: 400 });
  }

  const { targetType, targetId, reason } = body;

  if (!isTarget(targetType)) {
    return NextResponse.json({ error: 'Choose what you are reporting.' }, { status: 400 });
  }

  if (typeof targetId !== 'string' || !targetId.trim()) {
    return NextResponse.json({ error: 'Choose what you are reporting.' }, { status: 400 });
  }

  if (typeof reason !== 'string' || !reason.trim()) {
    return NextResponse.json({ error: 'Tell the team what is wrong.' }, { status: 400 });
  }

  if (reason.trim().length > MAX_REASON_LENGTH) {
    return NextResponse.json(
      { error: `Keep your report to ${MAX_REASON_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  try {
    const result = await submitFlag({
      reporterClerkId: userId,
      targetType,
      targetId: targetId.trim(),
      reason: reason.trim(),
    });

    if (result.status === 'not-onboarded') {
      return NextResponse.json(
        { error: 'Finish onboarding before reporting something.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    if (result.status === 'not-found') {
      return NextResponse.json({ error: 'That content could not be found.' }, { status: 404 });
    }

    if (result.status === 'own') {
      return NextResponse.json({ error: 'You cannot report your own content.' }, { status: 400 });
    }

    // The same answer either way, so repeat taps are quiet rather than an error
    return NextResponse.json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    console.error('Failed to record a flag.', error);
    return NextResponse.json({ error: 'Unable to send the report right now.' }, { status: 500 });
  }
}
