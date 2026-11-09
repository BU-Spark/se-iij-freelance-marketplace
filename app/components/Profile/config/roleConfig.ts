import type { AccountProfile, ProfileRole, RoleValue } from '../../../types/profile.types';
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
  /** fields that must be filled in before the role counts as finished */
  requiredFields: string[];
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
    // nothing here is mandatory: a freelancer can fill the rest in whenever
    requiredFields: [],
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
    // editors.job_title is NOT NULL, so a card without one cannot be saved
    requiredFields: ['jobTitle'],
  },
};

/** The roles in the order we show them */
export const ALL_ROLES: ProfileRole[] = PROFILE_ROLE_ORDER;

/** The fields a role still needs before its card counts as finished */
export const requiredFieldsFor = (role: ProfileRole): RoleField[] =>
  ROLE_CONFIG[role].fields.filter((field) => ROLE_CONFIG[role].requiredFields.includes(field.key));

/** True when a text field has text or a chip list has at least one pick */
export const isFilled = (value: RoleValue | undefined) =>
  Array.isArray(value) ? value.length > 0 : value !== undefined && String(value).trim() !== '';

/**
 * How much of the profile has been filled in, as a whole percentage, so the panel can nudge the
 * rest. Counts the shared bios plus every field a role card lets you edit; `readonly` fields are
 * left out because the panel cannot change them, which keeps 100% reachable.
 */
export function profileCompletion(profile: AccountProfile): number {
  const checks = [
    isFilled(profile.basic.shortBio),
    isFilled(profile.basic.longBio),
    profile.roles.length > 0,
    ...profile.roles.flatMap((details) =>
      ROLE_CONFIG[details.role].fields
        .filter((field) => field.type !== 'readonly')
        .map((field) => isFilled(details.facts[field.key]))
    ),
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
