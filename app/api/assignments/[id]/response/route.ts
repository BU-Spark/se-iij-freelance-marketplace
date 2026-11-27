import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadAssignmentViewer, type AssignmentViewer } from '../../../../../lib/assignments';
import { applyToAssignment, withdrawApplication } from '../../../../../lib/assignmentResponses';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

type ViewerResult = { viewer: AssignmentViewer } | { response: NextResponse };

/** The freelancer behind the request, or the answer to send when they are not one yet */
async function freelancerFor(userId: string): Promise<ViewerResult> {
  const viewer = await loadAssignmentViewer(userId);

  if (!viewer) {
    return {
      response: NextResponse.json(
        { error: 'Finish onboarding before answering assignments.', code: 'onboarding_required' },
        { status: 400 }
      ),
    };
  }

  if (!viewer.roles.includes('freelancer')) {
    return { response: NextResponse.json({ error: 'Only freelancers answer assignments.' }, { status: 403 }) };
  }

  return { viewer };
}

/** Applies the freelancer to the assignment. Applying again keeps the same answer. */
export async function PUT(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to answer an assignment.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The answer is not valid JSON.' }, { status: 400 });
  }

  const kind = typeof body === 'object' && body !== null ? (body as { kind?: unknown }).kind : undefined;

  if (kind !== 'interested') {
    return NextResponse.json({ error: 'Say you are interested in this assignment.' }, { status: 400 });
  }

  const { id } = await params;

  try {
    const result = await freelancerFor(userId);
    if ('response' in result) return result.response;

    const saved = await applyToAssignment(id, result.viewer.userId);

    // Missing and closed read the same, so a stale card cannot be used to probe assignments
    if (!saved) {
      return NextResponse.json({ error: 'This assignment is no longer taking answers.' }, { status: 404 });
    }

    return NextResponse.json({ response: saved });
  } catch (error) {
    console.error('Failed to save an answer to an assignment.', error);
    return NextResponse.json({ error: 'Unable to save your answer right now.' }, { status: 500 });
  }
}

/** Takes an application back, e.g. after changing their mind. Withdrawing twice is harmless. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to answer an assignment.' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await freelancerFor(userId);
    if ('response' in result) return result.response;

    await withdrawApplication(id, result.viewer.userId);

    return NextResponse.json({ withdrawn: true });
  } catch (error) {
    console.error('Failed to withdraw an answer to an assignment.', error);
    return NextResponse.json({ error: 'Unable to withdraw your answer right now.' }, { status: 500 });
  }
}
