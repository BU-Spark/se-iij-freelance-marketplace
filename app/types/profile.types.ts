import type { AvailabilityException } from './availability.types';

/** The roles a person can have. One person can have both. */
export type ProfileRole = 'editor' | 'freelancer';

/** The order the panel shows roles in, and the order "Add role" offers them */
export const PROFILE_ROLE_ORDER: ProfileRole[] = ['freelancer', 'editor'];

/**
 * Shared info every user has, whatever their role.
 * Everything here is a column on `users`; location and the rest live on the role rows.
 */
export type BasicInfo = {
  firstName: string;
  lastName: string;
  email: string;
  shortBio: string;
  longBio: string;
  /** S3 object key; the bucket is private, so this is never rendered directly */
  photoKey?: string;
  /** short-lived signed URL derived from photoKey */
  photoUrl?: string;
  /** the person's own "free right now" flag, shown as a dot on their avatar */
  availableNow: boolean;
  /** when that flag stops counting; null when it has no timer */
  availableUntil?: string | null;
};

/** A value a role field holds: text, a chip list, or a number */
export type RoleValue = string | string[] | number;

/** One of the person's roles, with its fields already shaped for the panel */
export type RoleDetails = {
  role: ProfileRole;
  /** keyed exactly like ROLE_CONFIG[role].fields */
  facts: Record<string, RoleValue>;
};

/** A user's whole profile: basic info + one card per role they have */
export type AccountProfile = {
  id: string;
  basic: BasicInfo;
  roles: RoleDetails[];
};

/** Availability as stored in JSONB; the driver hands back dates as strings */
export type StoredAvailability = {
  days?: string[];
  timezone?: string;
  typicalWorkingWindow?: { startsAt?: string; endsAt?: string };
  exceptions?: AvailabilityException[];
};

/** One row of users LEFT JOIN editors LEFT JOIN freelancers, as the profile needs it */
export type ProfileRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  short_bio: string | null;
  long_bio: string | null;
  photo_key: string | null;
  available_now: boolean | null;
  available_until: string | Date | null;
  roles: string[] | null;
  preferences: Record<string, unknown> | null;
  editor_id: string | null;
  organization_id: string | null;
  desks: string[] | null;
  job_title: string | null;
  years_at_desk: number | null;
  editor_location: string | null;
  pitch_preferences: Record<string, unknown> | null;
  editor_availability: StoredAvailability | null;
  freelancer_id: string | null;
  freelancer_location: string | null;
  rate: string | null;
  community_covered: string | null;
  beats: string[] | null;
  beat_other: string | null;
  skills: string[] | null;
  beat_tags: string[] | null;
  work_mediums: string[] | null;
  tools: string[] | null;
  portfolio: unknown[] | null;
  freelancer_availability: StoredAvailability | null;
};
