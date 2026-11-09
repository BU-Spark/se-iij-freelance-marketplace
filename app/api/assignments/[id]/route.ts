import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { canEditAssignment, getAssignment, loadAssignmentViewer } from '../../../../lib/assignments';
import {
  combineLengthAndTime,
  isRecord,
  parseAssignmentBody,
  validateAssignment,
} from '../../../utils/assignment.utils';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/** Updates an assignment. Only editors from the organization that posted it may do this. */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to edit an assignment.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The assignment payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The assignment payload is invalid.' }, { status: 400 });
  }

  const { id } = await params;

  try {
    const [viewer, existing] = await Promise.all([loadAssignmentViewer(userId), getAssignment(id)]);

    // Same answer for "missing" and "someone else's" so ids from other organizations don't leak
    if (!existing || !viewer || !canEditAssignment(viewer, existing)) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    // The slug is the assignment's stable identifier, so an edit keeps the one it was posted with
    const input = { ...parseAssignmentBody(body), slug: existing.slug };
    const errors = validateAssignment(input);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Please fix the highlighted fields.', errors }, { status: 400 });
    }

    const updated = await db.query<{ id: string }>(
      `UPDATE assignments
          SET title = $2, description = $3, category = $4, contact = $5, location = $6,
              length = $7, deadline = $8, compensation = $9, updated_at = NOW()
        WHERE id = $1
        RETURNING id`,
      [
        existing.id,
        input.title,
        input.description,
        input.category,
        input.contact,
        input.location,
        combineLengthAndTime(input.length, input.time),
        input.deadline ? new Date(input.deadline) : null,
        input.compensation,
      ]
    );

    if (!updated.rowCount) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    return NextResponse.json({ saved: true, id: existing.id });
  } catch (error) {
    console.error('Failed to update assignment.', error);
    return NextResponse.json({ error: 'Unable to save the assignment right now.' }, { status: 500 });
  }
}
