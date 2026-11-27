import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadAssignmentViewer } from '../../../../lib/assignments';
import { listAssignmentResponses } from '../../../../lib/assignmentResponses';

export const runtime = 'nodejs';

/** Everything the signed-in freelancer has applied to, so the feed can mark the cards they answered */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see your answers.' }, { status: 401 });
  }

  try {
    const viewer = await loadAssignmentViewer(userId);

    if (!viewer) {
      return NextResponse.json(
        { error: 'Finish onboarding before answering assignments.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    if (!viewer.roles.includes('freelancer')) {
      return NextResponse.json({ error: 'Only freelancers answer assignments.' }, { status: 403 });
    }

    const responses = await listAssignmentResponses(viewer.userId);

    return NextResponse.json({ responses });
  } catch (error) {
    console.error('Failed to load the freelancer’s answers.', error);
    return NextResponse.json({ error: 'Unable to load your answers right now.' }, { status: 500 });
  }
}
