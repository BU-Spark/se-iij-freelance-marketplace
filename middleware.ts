import { clerkClient, clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { isAdminMetadata } from './lib/auth';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)']);
const isPublicRoute = createRouteMatcher(['/', '/login(.*)', '/signup(.*)', '/forgot-password(.*)']);

/** Admin is kept in public metadata, which is not on the session token by default */
const isAdmin = async (userId: string) => {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return isAdminMetadata(user.publicMetadata);
  } catch (error) {
    console.error('Could not check whether this person is an admin.', error);
    return false;
  }
};

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // The admin area is for the Story Match team only
  if (isAdminRoute(request)) {
    if (!userId) return NextResponse.redirect(new URL('/login', request.url));
    if (!(await isAdmin(userId))) return NextResponse.redirect(new URL('/dashboard', request.url));
    return;
  }

  if (userId && isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }

  // Admins never onboard: their basic row is filled in from Clerk on the first admin visit
  if (userId && isOnboardingRoute(request) && (await isAdmin(userId))) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
