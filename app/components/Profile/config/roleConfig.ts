import type { ProfileRole } from '../../../types/profile.types';
import { PROFILE_ROLE_ORDER } from '../../../types/profile.types';

export type RoleFieldType = 'text' | 'number' | 'chips' | 'org' | 'readonly';

export type RoleField = {
  key: string;
  label: string;
  type: RoleFieldType;
};

type RoleConfig = {
  label: string;
  /** colours for the pill and the top edge of the card */
  accent: string;
  tint: string;
  ink: string;
  /** which fields this role has, in order; `readonly` ones are shown but not edited */
  fields: RoleField[];
};

/** Everything that differs between roles lives here; the card and the form both read from it */
export const ROLE_CONFIG: Record<ProfileRole, RoleConfig> = {
  freelancer: {
    label: 'Freelancer',
    accent: '#2f55d4',
    tint: '#eef2fd',
    ink: '#1e3a9e',
    fields: [
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'rate', label: 'Usual rate', type: 'text' },
      { key: 'communityCovered', label: 'Community covered', type: 'text' },
      { key: 'reportingBeats', label: 'Reporting beats', type: 'chips' },
      { key: 'beatTags', label: 'Beat tags', type: 'chips' },
      { key: 'workMediums', label: 'Work mediums', type: 'chips' },
      { key: 'tools', label: 'Tools', type: 'chips' },
      { key: 'availability', label: 'Availability', type: 'readonly' },
    ],
  },
  editor: {
    label: 'Editor',
    accent: '#1f8a70',
    tint: '#e8f6ee',
    ink: '#17663a',
    fields: [
      { key: 'organizationId', label: 'Organisation', type: 'org' },
      { key: 'jobTitle', label: 'Job title', type: 'text' },
      { key: 'desks', label: 'Desks', type: 'chips' },
      { key: 'yearsAtDesk', label: 'Years at desk', type: 'number' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'preferredPitchFormat', label: 'Preferred pitch format', type: 'text' },
      { key: 'averageResponseTime', label: 'Average response time (days)', type: 'number' },
      { key: 'interestedTopics', label: 'Interested topics', type: 'chips' },
      { key: 'editorialPreferences', label: 'Editorial preferences', type: 'chips' },
      { key: 'lookingFor', label: 'Looking for', type: 'chips' },
      { key: 'availability', label: 'Availability', type: 'readonly' },
    ],
  },
};

/** The roles in the order we show them */
export const ALL_ROLES: ProfileRole[] = PROFILE_ROLE_ORDER;
