import type { Weekday } from './availability.types';
import type { RateUnit } from './dashboard.types';
import type { Organization } from './organization.types';
import type { PortfolioItem } from './portfolioItem.types';
import type { Editor, Freelancer, User, UserPreferences } from './user.types';

/** Which side of the marketplace the user picked on step 1 (maps to `Role` in user.types on submit) */
export type OnboardingRole = 'editor' | 'freelancer';

/** The organization fields the onboarding picker shows */
export type OrgOption = Pick<Organization, 'id' | 'name' | 'city'>;

/** Form state for the profile step. Field names mirror User / Editor / Freelancer. */
export interface ProfileData {
  // shared -> User
  firstName: string;
  lastName: string;
  email: string;
  /** client-only: true once the work email's one-time code has been confirmed */
  businessEmailVerified: boolean;
  /** client-only 18+ gate: checked in the browser and never sent to the API */
  dateOfBirth: string;
  shortBio: string;
  longBio: string;
  // profile photo: the S3 object key is saved, the signed URL is only for previewing it
  photoKey: string;
  photoUrl: string;
  // preferences -> User.preferences
  theme: UserPreferences['theme'];
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  // editor -> Editor
  jobTitle: string;
  yearsAtDesk: number;
  organizationId: string;
  desks: string[];
  preferredPitchFormat: string;
  averageResponseTime: number;
  interestedTopics: string[];
  editorialPreferences: string[];
  lookingFor: string[];
  // freelancer -> Freelancer
  location: string;
  reportingBeats: string[];
  workMediums: string[];
  tools: string[];
  portfolio: PortfolioItem[];
  rateAmount: string;
  rateUnit: RateUnit;
  communityCovered: string;
  beatTags: string[];
  // availability -> Editor.availability / Freelancer.availability
  availableDays: Weekday[];
  workdayStart: string;
  workdayEnd: string;
  timezone: string;
}

export type ProfileErrors = Partial<Record<keyof ProfileData, string>> & { roles?: string };
export type Touched = Partial<Record<keyof ProfileData, boolean>>;

/**
 * Steps are per role, so the flow is built from the roles the user picked:
 * role -> editor-profile -> editor-preferences -> freelancer-profile -> ... -> done
 */
export type Step =
  | 'role'
  | 'age'
  | 'editor-profile'
  | 'editor-preferences'
  | 'freelancer-profile'
  | 'freelancer-preferences'
  | 'done';

/** `update` handler passed down to every step component */
export type ProfileUpdate = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
export type ProfileTouch = (key: keyof ProfileData) => void;
/** Errors stay hidden until the field has been touched */
export type FieldError = (key: keyof ProfileData) => string | undefined;

/** The User fields onboarding collects; id, username, timestamps etc. are set by the backend */
export type NewUser = Pick<
  User,
  'email' | 'firstName' | 'lastName' | 'shortBio' | 'longBio' | 'photoKey' | 'preferences' | 'roles'
>;
export type NewEditor = Omit<Editor, 'user'>;
export type NewFreelancer = Omit<Freelancer, 'user'>;

/** `user` is shared, so each selected role contributes only its own record */
export type OnboardingPayload = {
  user: NewUser;
  roles: OnboardingRole[];
  editor?: NewEditor;
  freelancer?: NewFreelancer;
};
