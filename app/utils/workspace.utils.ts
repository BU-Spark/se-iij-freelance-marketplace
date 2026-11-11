import type { ProfileRole } from '../types/profile.types';

/**
 * Where a person works, given the roles on their profile. Someone with only the freelancer role
 * has no editor desk to go back to, so their home is the freelancer workspace.
 */
export const workspaceHome = (roles: ProfileRole[]): '/dashboard' | '/dashboard/freelancer' =>
  roles.includes('editor') ? '/dashboard' : '/dashboard/freelancer';

/** Pages that belong to the freelancer side; everything else under /dashboard is the editor desk */
const FREELANCER_PATHS = ['/dashboard/freelancer', '/dashboard/assignments', '/dashboard/availability'];

/**
 * Which workspace a dashboard URL belongs to, so the shared header opens on that side.
 * One assignment's page is shared by both sides: editors see it from the desk, and people who
 * only freelance see it from their workspace.
 */
export const workspaceForPath = (pathname: string, heldRoles: ProfileRole[]): ProfileRole => {
  if (pathname.startsWith('/dashboard/assignments/')) {
    return heldRoles.length > 0 && !heldRoles.includes('editor') ? 'freelancer' : 'editor';
  }

  const freelancerPage = FREELANCER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  return freelancerPage ? 'freelancer' : 'editor';
};
