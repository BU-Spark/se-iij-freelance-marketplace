import type { ProfileRole } from '../../../types';

export type NavItem = {
  key: string;
  label: string;
  href: string;
  /** Only highlight on this exact URL (not on pages under it) */
  exact?: boolean;
};

export const NAV_ITEMS: Record<ProfileRole, NavItem[]> = {
  editor: [
    { key: 'desk', label: 'Desk', href: '/dashboard', exact: true },
    { key: 'roster', label: 'Roster', href: '/dashboard/roster' },
    { key: 'pitches', label: 'Pitches', href: '/dashboard/pitches' },
  ],
  freelancer: [
    { key: 'assignments', label: 'Available assignments', href: '/dashboard/freelancer' },
    { key: 'my-pitches', label: 'My pitches', href: '/freelancer/pitches' },
    { key: 'organizations', label: 'Organizations', href: '/freelancer/organizations' },
  ],
};
