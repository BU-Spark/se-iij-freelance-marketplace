import type { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSignedInUserAdmin } from '../../lib/auth';
import { hasProfile, loadProfileRoles } from '../../lib/profile';
import { EditorHeader } from '../components/header/EditorHeader';
import type { ProfileRole } from '../types/profile.types';
import styles from './layout.module.css';

/**
 * Nobody sees the dashboard before onboarding has created their profile, so the profile panel
 * can never open on a user with nothing to show. A database blip fails open: showing the
 * dashboard is better than bouncing someone into onboarding for a transient error.
 * Admins belong in the admin area, so they are sent there instead.
 *
 * Every dashboard page shares one header, mounted here so no page can leave it out or set it up
 * differently. It opens on the side of the desk the URL belongs to.
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

  // Lets the header show the right role switch on first paint; it reloads them from the profile anyway
  let roles: ProfileRole[] = [];

  try {
    roles = await loadProfileRoles(userId);
  } catch (error) {
    console.error('Could not read the roles for the dashboard header.', error);
  }

  return (
    <div className={styles.workspace}>
      <EditorHeader initialRoles={roles} />
      <div className={styles.page}>{children}</div>
    </div>
  );
}
