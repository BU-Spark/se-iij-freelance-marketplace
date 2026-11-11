import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { ProfileRole } from '../app/types/profile.types';
import { workspaceHome } from '../app/utils/workspace.utils';
import { loadProfileRoles } from './profile';

/**
 * Keeps each workspace for the people who hold that role. Onboarding has already run by the time
 * these pages render, so a missing row or a failed lookup fails open rather than locking anyone out.
 */
export async function requireWorkspace(role: ProfileRole): Promise<void> {
  const { userId } = await auth();

  if (!userId) redirect('/login');

  let roles: ProfileRole[];

  try {
    roles = await loadProfileRoles(userId);
  } catch (error) {
    console.error('Could not check which workspaces this person has.', error);
    return;
  }

  if (roles.length > 0 && !roles.includes(role)) redirect(workspaceHome(roles));
}
