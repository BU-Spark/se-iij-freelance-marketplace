import type { ProfileRole } from '../types/profile.types';

/**
 * Where a person works, given the roles on their profile. Someone with only the freelancer role
 * has no editor desk to go back to, so their home is the freelancer workspace.
 */
export const workspaceHome = (roles: ProfileRole[]): '/dashboard' | '/dashboard/freelancer' =>
  roles.includes('editor') ? '/dashboard' : '/dashboard/freelancer';
