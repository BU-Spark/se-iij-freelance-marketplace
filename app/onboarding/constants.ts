import type { OrgOption, ProfileData } from '../types/onboarding.types';

/* ------------------------------------------------------------------ */
/*  Temporary static data for onboarding                               */
/*  TODO: replace with data from the backend once the API exists       */
/* ------------------------------------------------------------------ */

export const DEFAULT_ORGS: OrgOption[] = [
  { id: 'meridian', name: 'The Meridian Post', city: 'New York' },
  { id: 'crosswind', name: 'Crosswind Weekly', city: 'Berlin' },
  { id: 'signal', name: 'Signal Room', city: 'Remote' },
  { id: 'broadsheet', name: 'Broadsheet Pacific', city: 'Tokyo' },
];

export const TOPICS = [
  'Politics',
  'Business',
  'Climate',
  'Tech',
  'Culture',
  'Health',
  'Local',
  'World',
  'Sports',
  'Investigations',
];

export const MEDIUMS = ['Text', 'Photo', 'Video', 'Audio', 'Data', 'Illustration'];

// Each chip gets a logo color, cycling through the fan
export const CHIP_COLORS = [
  'var(--c-green)',
  'var(--c-amber)',
  'var(--c-red)',
  'var(--c-purple)',
  'var(--c-sky)',
  'var(--c-blue)',
  'var(--c-yellow)',
  'var(--c-pink)',
  'var(--c-green-d)',
  'var(--c-orange)',
];

export const EMPTY: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  shortBio: '',
  jobTitle: '',
  yearsAtDesk: 0,
  organizationId: 'meridian',
  desks: [],
  location: '',
  reportingBeats: [],
  workMediums: [],
  tools: [],
  portfolio: [],
};
