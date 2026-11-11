import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { landingPathFor } from '../../../../lib/auth';

export const runtime = 'nodejs';

/**
 * Where to send someone right after they sign in. The browser cannot read public metadata on its
 * own, so the login form asks here instead of guessing. A Clerk hiccup falls back to the app.
 */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ redirectTo: '/login' }, { status: 401 });
  }

  try {
    return NextResponse.json({ redirectTo: landingPathFor(await currentUser()) });
  } catch (error) {
    console.error('Could not work out where this person should land.', error);
    return NextResponse.json({ redirectTo: '/dashboard' });
  }
}
