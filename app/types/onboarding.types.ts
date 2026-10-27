import type { Organization } from './organization.types';
import type { PortfolioItem } from './portfolioItem.types';
import type { Editor, Freelancer, User } from './user.types';

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
  // editor -> Editor
  jobTitle: string;
  yearsAtDesk: number;
  organizationId: string;
  desks: string[];
  // freelancer -> Freelancer
  location: string;
  reportingBeats: string[];
  workMediums: string[];
  tools: string[];
  portfolio: PortfolioItem[];
}

export type ProfileErrors = Partial<Record<keyof ProfileData, string>>;
export type Step = 'role' | 'profile' | 'done';

/** The User fields onboarding collects; id, username, timestamps etc. are set by the backend */
export type NewUser = Pick<User, 'email' | 'firstName' | 'lastName' | 'shortBio' | 'roles'>;
export type NewEditor = Omit<Editor, 'user'> & { user: NewUser };
export type NewFreelancer = Omit<Freelancer, 'user'> & { user: NewUser };

export type OnboardingPayload = {
  role: OnboardingRole;
  profile: NewEditor | NewFreelancer;
};
