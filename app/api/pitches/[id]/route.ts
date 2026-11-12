import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  STATUS_FOR_DECISION,
  canEditPitch,
  getPitch,
  loadPitchViewer,
  saveFeedback,
  setPitchStatus,
} from '../../../../lib/pitches';
import { isRecord } from '../../../utils/assignment.utils';
import { isPitchFeedback, isPitchStatus } from '../../../utils/pitch.utils';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Moves a pitch along the desk's review, either by setting its status or by sending feedback
 * (which carries the status with it). Only the editor the pitch was sent to may do this.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to review a pitch.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The pitch payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The pitch payload is invalid.' }, { status: 400 });
  }

  const { id } = await params;

  try {
    const [viewer, existing] = await Promise.all([loadPitchViewer(userId), getPitch(id)]);

    // Same answer for "missing" and "someone else's" so pitch ids from other desks don't leak
    if (!existing || !canEditPitch(viewer, existing)) {
      return NextResponse.json({ error: 'Pitch not found.' }, { status: 404 });
    }

    // Feedback wins when both are sent, because a decision always moves the status too
    if ('feedback' in body) {
      if (!isPitchFeedback(body.feedback)) {
        return NextResponse.json({ error: 'The pitch feedback is invalid.' }, { status: 400 });
      }

      if (!(await saveFeedback(existing.id, body.feedback))) {
        return NextResponse.json({ error: 'Pitch not found.' }, { status: 404 });
      }

      return NextResponse.json({
        id: existing.id,
        status: STATUS_FOR_DECISION[body.feedback.decision],
      });
    }

    if (!isPitchStatus(body.status)) {
      return NextResponse.json({ error: 'Choose a valid pitch status.' }, { status: 400 });
    }

    if (!(await setPitchStatus(existing.id, body.status))) {
      return NextResponse.json({ error: 'Pitch not found.' }, { status: 404 });
    }

    return NextResponse.json({ id: existing.id, status: body.status });
  } catch (error) {
    console.error('Failed to update a pitch.', error);
    return NextResponse.json({ error: 'Unable to update the pitch right now.' }, { status: 500 });
  }
}
