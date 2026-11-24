import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { listBeats } from '../../../lib/beats';

export const runtime = 'nodejs';

/**
 * The beats freelancers can pick during onboarding. The onboarding flow reads this so a beat the
 * team adds or removes shows up there without a deploy.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see the beats.' }, { status: 401 });
  }

  try {
    const beats = await listBeats();
    return NextResponse.json({ beats: beats.map((beat) => beat.name) });
  } catch (error) {
    console.error('Failed to load the beats.', error);
    return NextResponse.json({ error: 'Unable to load the beats right now.' }, { status: 500 });
  }
}
