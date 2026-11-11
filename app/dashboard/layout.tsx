import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSignedInUserAdmin } from '../../lib/auth';
import { hasProfile } from '../../lib/profile';

/**
 * Nobody sees the dashboard before onboarding has created their profile, so the profile panel
 * can never open on a user with nothing to show. A database blip fails open: showing the
 * dashboard is better than bouncing someone into onboarding for a transient error.
 * Admins belong in the admin area, so they are sent there instead.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  let admin = false;

  try {
    admin = await isSignedInUserAdmin();
  } catch (error) {
    console.error('Could not check whether this person is an admin.', error);
  }

  if (admin) redirect('/admin');

  let startedOnboarding = true;

  try {
    startedOnboarding = await hasProfile(userId);
  } catch (error) {
    console.error('Could not check the profile before rendering the dashboard.', error);
  }

  if (!startedOnboarding) redirect('/onboarding');

  return children;
}
