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
  shortBio: string;
  longBio: string;
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

export type ProfileErrors = Partial<Record<keyof ProfileData, string>>;
export type Touched = Partial<Record<keyof ProfileData, boolean>>;
export type Step = 'role' | 'profile' | 'preferences' | 'done';

/** `update` handler passed down to every step component */
export type ProfileUpdate = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
export type ProfileTouch = (key: keyof ProfileData) => void;
/** Errors stay hidden until the field has been touched */
export type FieldError = (key: keyof ProfileData) => string | undefined;

/** The User fields onboarding collects; id, username, timestamps etc. are set by the backend */
export type NewUser = Pick<User, 'email' | 'firstName' | 'lastName' | 'shortBio' | 'longBio' | 'preferences' | 'roles'>;
export type NewEditor = Omit<Editor, 'user'> & { user: NewUser };
export type NewFreelancer = Omit<Freelancer, 'user'> & { user: NewUser };

export type OnboardingPayload = {
  role: OnboardingRole;
  profile: NewEditor | NewFreelancer;
};
