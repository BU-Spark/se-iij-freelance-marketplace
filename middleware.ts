import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/onboarding(.*)']);
const isPublicRoute = createRouteMatcher(['/', '/login(.*)', '/signup(.*)', '/forgot-password(.*)']);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (userId && isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};
