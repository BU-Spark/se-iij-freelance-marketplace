import type { ProfileRole } from '../../types/profile.types';

type RoleConfig = {
  label: string;
  /** colours for the pill and the top edge of the card */
  accent: string;
  tint: string;
  ink: string;
  /** which facts this role shows, in order */
  facts: { key: string; label: string }[];
};

/** Everything that differs between roles lives here; RoleCard reads from it */
export const ROLE_CONFIG: Record<ProfileRole, RoleConfig> = {
  freelancer: {
    label: 'Freelancer',
    accent: '#2f55d4',
    tint: '#eef2fd',
    ink: '#1e3a9e',
    facts: [
      { key: 'typeOfWork', label: 'Type of work' },
      { key: 'beats', label: 'Beats' },
      { key: 'rate', label: 'Usual rate' },
    ],
  },
  editor: {
    label: 'Editor',
    accent: '#1f8a70',
    tint: '#e8f6ee',
    ink: '#17663a',
    facts: [
      { key: 'organisation', label: 'Organisation' },
      { key: 'desk', label: 'Desk' },
      { key: 'commissions', label: 'Commissions' },
    ],
  },
};

/** The roles in the order we show them */
export const ALL_ROLES: ProfileRole[] = ['freelancer', 'editor'];
