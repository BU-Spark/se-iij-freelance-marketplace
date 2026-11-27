import type { OrgReach } from '../../dashboard/freelancer/organizations/constants';
import { BEAT_OTHER, BEATS } from '../../onboarding/constants';

export const DETAILS_PATH = '/organizations/signup/details';

/** Step 1: the login for the person registering the newsroom */
export type OrgAccount = {
  contactName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export const EMPTY_ACCOUNT: OrgAccount = { contactName: '', email: '', password: '', confirmPassword: '' };

/** Step 2: the page freelancers will read, in the order the form asks for it */
export type OrgDetails = {
  name: string;
  website: string;
  city: string;
  reach: OrgReach;
  tagline: string;
  bio: string;
  beats: string[];
  rate: string;
};

export const EMPTY_DETAILS: OrgDetails = {
  name: '',
  website: '',
  city: '',
  reach: 'local',
  tagline: '',
  bio: '',
  beats: [],
  rate: '',
};

/** A newsroom picks from the same beats freelancers do; "Other" only makes sense for a person */
export const ORG_BEATS = BEATS.filter((beat) => beat !== BEAT_OTHER);
