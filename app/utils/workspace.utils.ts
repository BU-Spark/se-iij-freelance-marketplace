import type { ProfileRole } from '../types/profile.types';

/**
 * Where a person works, given the roles on their profile. Someone with only the freelancer role
 * has no editor desk to go back to, so their home is the freelancer workspace.
 */
export const workspaceHome = (roles: ProfileRole[]): '/dashboard' | '/dashboard/freelancer' =>
  roles.includes('editor') ? '/dashboard' : '/dashboard/freelancer';

/** Pages that belong to the freelancer side; everything else under /dashboard is the editor desk */
const FREELANCER_PATHS = ['/dashboard/freelancer', '/dashboard/assignments'];

/** Pages both sides share: one assignment's page and settings */
const SHARED_PATHS = ['/dashboard/assignments/', '/dashboard/settings'];

/**
 * Which workspace a dashboard URL belongs to, so the shared header opens on that side.
 * Shared pages open on the desk for editors, and in the workspace for people who only freelance.
 */
export const workspaceForPath = (pathname: string, heldRoles: ProfileRole[]): ProfileRole => {
  if (SHARED_PATHS.some((path) => pathname.startsWith(path))) {
    return heldRoles.length > 0 && !heldRoles.includes('editor') ? 'freelancer' : 'editor';
  }

  const freelancerPage = FREELANCER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return freelancerPage ? 'freelancer' : 'editor';
};
