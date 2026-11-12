import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  createPitch,
  findEditorByEmail,
  listPitchesForEditor,
  listPitchesForFreelancer,
  loadPitchViewer,
} from '../../../lib/pitches';
import { hasErrors, isRecord } from '../../utils/assignment.utils';
import { formatPitchCompensation, parsePitchDraft } from '../../utils/pitch.utils';
import { pitchSlug, validatePitch } from '../../components/PitchForm/pitchForm.utils';

export const runtime = 'nodejs';

/**
 * The pitches this person can see. Editors get the pitches sent to them; everyone else gets the
 * pitches they sent. `?scope=sent` asks for their own sent pitches even when they also edit.
 */
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see pitches.' }, { status: 401 });
  }

  try {
    const viewer = await loadPitchViewer(userId);
    if (!viewer) return NextResponse.json({ items: [] });

    const wantsSent = new URL(request.url).searchParams.get('scope') === 'sent';
    const sent = wantsSent || !viewer.roles.includes('editor');
    const items = sent
      ? await listPitchesForFreelancer(viewer.userId)
      : await listPitchesForEditor(viewer.userId);

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to load pitches.', error);
    return NextResponse.json({ error: 'Unable to load pitches right now.' }, { status: 500 });
  }
}

/**
 * Sends a pitch to an editor. The body is the composer's draft; the author comes from the
 * session and the recipient is resolved from the editor email in the draft.
 */
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to send a pitch.' }, { status: 401 });
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

  // Same checks the composer runs before it lets you review, so the API is never looser than the form
  const draft = parsePitchDraft(body);
  const errors = validatePitch(draft);
  if (hasErrors(errors)) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', errors }, { status: 400 });
  }

  try {
    const viewer = await loadPitchViewer(userId);

    if (!viewer) {
      return NextResponse.json(
        { error: 'Finish onboarding before sending a pitch.', code: 'onboarding_required' },
        { status: 400 }
      );
    }

    if (!viewer.roles.includes('freelancer')) {
      return NextResponse.json({ error: 'Only a freelancer workspace can send a pitch.' }, { status: 403 });
    }

    const editorId = await findEditorByEmail(draft.editorEmail);
    if (!editorId) {
      return NextResponse.json(
        {
          error: 'We could not find an editor with that email.',
          errors: { editorEmail: 'We could not find an editor with that email.' },
        },
        { status: 400 }
      );
    }

    const pitch = await createPitch(viewer.userId, {
      targetEditorUserId: editorId,
      slug: pitchSlug(draft.title),
      category: draft.category,
      summary: draft.summary,
      description: draft.description,
      location: draft.location,
      length: draft.length,
      deadline: draft.deadline,
      compensation: formatPitchCompensation(draft.compensation),
    });

    if (!pitch) {
      return NextResponse.json(
        { error: 'You have already sent this pitch to that editor.' },
        { status: 409 }
      );
    }

    return NextResponse.json({ pitch }, { status: 201 });
  } catch (error) {
    console.error('Failed to send a pitch.', error);
    return NextResponse.json({ error: 'Unable to send the pitch right now.' }, { status: 500 });
  }
}
