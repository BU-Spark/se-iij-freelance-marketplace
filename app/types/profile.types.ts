/** The roles a person can have. One person can have both. */
export type ProfileRole = 'editor' | 'freelancer';

/** Shared info every user has, whatever their role */
export type BasicInfo = {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  /** link to their photo; if missing we show their initials */
  photoUrl?: string;
};

/** The basic info a person can change. Email is left out: Clerk owns the login email. */
export type EditableBasicInfo = Omit<BasicInfo, 'email'>;

/** What a person fills in for one of their roles */
export type RoleDetails = {
  role: ProfileRole;
  bio: string;
  /** role-specific answers, keyed by field name, e.g. { organisation: 'Harbour News' } */
  facts: Record<string, string>;
};

/** A user's whole profile: basic info + one card per role they have */
export type AccountProfile = {
  id: string;
  basic: BasicInfo;
  roles: RoleDetails[];
};
