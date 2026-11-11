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
    { key: 'talent', label: 'Find talent', href: '/dashboard/talent' },
    { key: 'pitches', label: 'Pitches', href: '/dashboard/pitches' },
    { key: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ],
  freelancer: [
    { key: 'assignments', label: 'Available assignments', href: '/dashboard/freelancer', exact: true },
    { key: 'my-assignments', label: 'My assignments', href: '/dashboard/freelancer#active-assignments' },
    // the profile and availability live together on the settings page
    { key: 'settings', label: 'Settings', href: '/dashboard/settings' },
  ],
};
