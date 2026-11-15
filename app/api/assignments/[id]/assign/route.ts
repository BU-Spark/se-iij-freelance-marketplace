import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import {
  assignFreelancer,
  canEditAssignment,
  getAssignment,
  loadAssignmentViewer,
} from '../../../../../lib/assignments';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Assigns a freelancer to an assignment. Only editors from the organization that posted it may do
 * this, and only freelancers who finished onboarding can be picked — the body never decides either.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to assign an assignment.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The assignment payload is not valid JSON.' }, { status: 400 });
  }

  const memberId = typeof body === 'object' && body !== null ? (body as { memberId?: unknown }).memberId : undefined;

  if (typeof memberId !== 'string' || !UUID_PATTERN.test(memberId)) {
    return NextResponse.json({ error: 'Pick a freelancer to assign.' }, { status: 400 });
  }

  const { id } = await params;

  try {
    const [viewer, existing] = await Promise.all([loadAssignmentViewer(userId), getAssignment(id)]);

    // Same answer for "missing" and "someone else's" so ids from other organizations don't leak
    if (!existing || !viewer || !canEditAssignment(viewer, existing)) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    const freelancer = await db.query<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 AND 'freelancer' = ANY(roles)`,
      [memberId]
    );

    if (!freelancer.rowCount) {
      return NextResponse.json({ error: 'That person is not a freelancer on the roster.' }, { status: 400 });
    }

    const assigned = await assignFreelancer(existing.id, memberId);

    if (!assigned) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    return NextResponse.json({
      saved: true,
      assignment: { id: assigned.id, status: assigned.status, assignedToId: assigned.assignedToUserId },
    });
  } catch (error) {
    console.error('Failed to assign the assignment.', error);
    return NextResponse.json({ error: 'Unable to assign this assignment right now.' }, { status: 500 });
  }
}
