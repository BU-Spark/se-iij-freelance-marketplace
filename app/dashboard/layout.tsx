import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasProfile } from '../../lib/profile';

/**
 * Nobody sees the dashboard before onboarding has created their profile, so the profile panel
 * can never open on a user with nothing to show. A database blip fails open: showing the
 * dashboard is better than bouncing someone into onboarding for a transient error.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  let startedOnboarding = true;

  try {
    startedOnboarding = await hasProfile(userId);
  } catch (error) {
    console.error('Could not check the profile before rendering the dashboard.', error);
  }

  if (!startedOnboarding) redirect('/onboarding');

  return children;
}
