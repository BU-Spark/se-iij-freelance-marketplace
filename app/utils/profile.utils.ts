import { Role } from '../types/user.types';
import type { Availability, Weekday } from '../types/availability.types';
import type { RateUnit } from '../types/dashboard.types';
import type {
  NewEditor,
  NewFreelancer,
  NewUser,
  OnboardingPayload,
  OnboardingRole,
  ProfileData,
} from '../types/onboarding.types';
import type { UserPreferences } from '../types/user.types';
import type {
  AccountProfile,
  BasicInfo,
  ProfileRole,
  ProfileRow,
  RoleDetails,
  RoleValue,
} from '../types/profile.types';
import { PROFILE_ROLE_ORDER } from '../types/profile.types';

/* ------------------------------------------------------------------ */
/*  Reads: database row -> the shape the profile panel renders         */
/* ------------------------------------------------------------------ */

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const list = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

const pitchPreferences = (raw: Record<string, unknown> | null) => ({
  preferredPitchFormat: str(raw?.preferredPitchFormat),
  averageResponseTime: typeof raw?.averageResponseTime === 'number' ? raw.averageResponseTime : 0,
  interestedTopics: list(raw?.interestedTopics),
  editorialPreferences: list(raw?.editorialPreferences),
  lookingFor: list(raw?.lookingFor),
});

const DAY_ORDER: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** "Mon–Fri · 09:00–17:00", or '' when no days are set */
const formatDays = (days: string[], startsAt: string, endsAt: string): string => {
  const positions = days
    .map((day) => DAY_ORDER.indexOf(day as Weekday))
    .filter((position) => position >= 0)
    .sort((a, b) => a - b);

  if (positions.length === 0) return '';

  const isWorkWeek = positions.length === 5 && positions.every((position, index) => position === index);
  const label = isWorkWeek
    ? 'Mon–Fri'
    : positions.map((position) => DAY_ORDER[position].slice(0, 3).replace(/^./, (c) => c.toUpperCase())).join(', ');

  return `${label} · ${startsAt}–${endsAt}`;
};

const storedAvailability = (raw: ProfileRow['editor_availability']): string =>
  formatDays(
    raw?.days ?? [],
    raw?.typicalWorkingWindow?.startsAt || '09:00',
    raw?.typicalWorkingWindow?.endsAt || '17:00'
  );

const editorDetails = (row: ProfileRow): RoleDetails => {
  const pitch = pitchPreferences(row.pitch_preferences);

  return {
    role: 'editor',
    facts: {
      organizationId: str(row.organization_id),
      jobTitle: str(row.job_title),
      desks: list(row.desks),
      yearsAtDesk: typeof row.years_at_desk === 'number' ? row.years_at_desk : 0,
      location: str(row.editor_location),
      preferredPitchFormat: pitch.preferredPitchFormat,
      averageResponseTime: pitch.averageResponseTime,
      interestedTopics: pitch.interestedTopics,
      editorialPreferences: pitch.editorialPreferences,
      lookingFor: pitch.lookingFor,
      availability: storedAvailability(row.editor_availability),
    },
  };
};

const freelancerDetails = (row: ProfileRow): RoleDetails => ({
  role: 'freelancer',
  facts: {
    location: str(row.freelancer_location),
    rate: str(row.rate),
    communityCovered: str(row.community_covered),
    reportingBeats: list(row.reporting_beats),
    beatTags: list(row.beat_tags),
    workMediums: list(row.work_mediums),
    tools: list(row.tools),
    availability: storedAvailability(row.freelancer_availability),
  },
});

/**
 * A role shows when either the role row or users.roles says it exists, so a profile saved
 * before the role arrays agreed still renders everything.
 */
const roleKeys = (row: ProfileRow): ProfileRole[] => {
  const present = new Set<string>(list(row.roles));
  if (row.editor_id) present.add('editor');
  if (row.freelancer_id) present.add('freelancer');
  return PROFILE_ROLE_ORDER.filter((role) => present.has(role));
};

export function toAccountProfile(row: ProfileRow, photoUrl?: string): AccountProfile {
  return {
    id: row.id,
    basic: {
      firstName: str(row.first_name),
      lastName: str(row.last_name),
      email: str(row.email),
      shortBio: str(row.short_bio),
      longBio: str(row.long_bio),
      photoKey: row.photo_key ?? undefined,
      photoUrl,
    },
    roles: roleKeys(row).map((role) => (role === 'editor' ? editorDetails(row) : freelancerDetails(row))),
  };
}

/** "Marcus Thorne" */
export function fullName(profile: AccountProfile): string {
  return `${profile.basic.firstName} ${profile.basic.lastName}`.trim();
}

/** The roles this person doesn't have yet (for the "Add role" button) */
export function missingRoles(profile: AccountProfile, all: ProfileRole[]): ProfileRole[] {
  return all.filter((r) => !profile.roles.some((x) => x.role === r));
}

/** Turns a panel field value into the string DetailList renders */
export function factText(value: RoleValue | undefined, resolveOrganization?: (id: string) => string): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return '';
  if (resolveOrganization && value) return resolveOrganization(value);
  return value;
}

/* ------------------------------------------------------------------ */
/*  Writes: panel edits -> validated column values                     */
/* ------------------------------------------------------------------ */

const EMAIL = /^\S+@\S+\.\S+$/;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const optional = (value: unknown) => text(value) || null;
const chips = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

/** Coerces a number field, returning null when the input isn't a non-negative number */
const count = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(text(value));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
};

export type BasicErrors = Partial<Record<'firstName' | 'email', string>>;

/** Only a first name and a usable email are required; the rest can stay blank */
export function validateBasic(basic: BasicInfo): BasicErrors {
  const errors: BasicErrors = {};
  if (!basic.firstName.trim()) errors.firstName = 'Add your first name.';
  if (!EMAIL.test(basic.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}

export type CleanBasic = {
  firstName: string;
  lastName: string;
  email: string;
  shortBio: string | null;
  longBio: string | null;
};

/** Coerces whatever the client sent into the four columns we write; non-strings become '' */
export function cleanBasic(input: Record<string, unknown>): CleanBasic {
  return {
    firstName: text(input.firstName),
    lastName: text(input.lastName),
    email: text(input.email),
    shortBio: optional(input.shortBio),
    longBio: optional(input.longBio),
  };
}

export type CleanEditor = {
  organizationId: string | null;
  jobTitle: string;
  desks: string[];
  yearsAtDesk: number;
  location: string | null;
  preferredPitchFormat: string;
  averageResponseTime: number;
  interestedTopics: string[];
  editorialPreferences: string[];
  lookingFor: string[];
};

export type CleanFreelancer = {
  location: string | null;
  rate: string | null;
  communityCovered: string | null;
  reportingBeats: string[];
  beatTags: string[];
  workMediums: string[];
  tools: string[];
};

export type CleanRole =
  | { ok: true; role: 'editor'; value: CleanEditor }
  | { ok: true; role: 'freelancer'; value: CleanFreelancer }
  | { ok: false; error: string };

export function cleanEditorFacts(facts: Record<string, unknown>): CleanRole {
  const jobTitle = text(facts.jobTitle);
  if (!jobTitle) return { ok: false, error: 'Add the job title for this desk.' };

  const yearsAtDesk = count(facts.yearsAtDesk ?? 0);
  if (yearsAtDesk === null) return { ok: false, error: 'Years at desk must be a number.' };

  const averageResponseTime = count(facts.averageResponseTime ?? 0);
  if (averageResponseTime === null) return { ok: false, error: 'Average response time must be a number.' };

  return {
    ok: true,
    role: 'editor',
    value: {
      organizationId: optional(facts.organizationId),
      jobTitle,
      desks: chips(facts.desks),
      yearsAtDesk,
      location: optional(facts.location),
      preferredPitchFormat: text(facts.preferredPitchFormat),
      averageResponseTime,
      interestedTopics: chips(facts.interestedTopics),
      editorialPreferences: chips(facts.editorialPreferences),
      lookingFor: chips(facts.lookingFor),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Onboarding: form state -> the payload the API takes                */
/* ------------------------------------------------------------------ */

export function cleanFreelancerFacts(facts: Record<string, unknown>): CleanRole {
  return {
    ok: true,
    role: 'freelancer',
    value: {
      location: optional(facts.location),
      rate: optional(facts.rate),
      communityCovered: optional(facts.communityCovered),
      reportingBeats: chips(facts.reportingBeats),
      beatTags: chips(facts.beatTags),
      workMediums: chips(facts.workMediums),
      tools: chips(facts.tools),
    },
  };
}

const ROLE_FOR: Record<OnboardingRole, Role> = {
  editor: Role.EDITOR,
  freelancer: Role.FREELANCER,
};

const FALLBACK_TIMEZONE = 'UTC';

/** The browser timezone, falling back to UTC when Intl is unavailable */
export const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
};

/** Turns the amount + unit pair into the single string the freelancer record stores */
export const formatRate = (amount: string, unit: RateUnit): string | undefined => {
  const value = Number(amount.trim());
  if (!amount.trim() || !Number.isFinite(value)) return undefined;
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return unit === 'flat' ? `$${formatted} flat` : `$${formatted} / ${unit}`;
};

/** "Mon–Fri · 09:00–17:00", or undefined when the user didn't pick any days */
export const summarizeAvailability = (d: ProfileData): string | undefined => {
  if (d.availableDays.length === 0) return undefined;

  const positions = d.availableDays.map((day) => DAY_ORDER.indexOf(day)).sort((a, b) => a - b);
  const isWorkWeek = positions.length === 5 && positions.every((position, index) => position === index);
  const days = isWorkWeek
    ? 'Mon–Fri'
    : positions.map((position) => DAY_ORDER[position].slice(0, 3).replace(/^./, (c) => c.toUpperCase())).join(', ');

  return `${days} · ${d.workdayStart || '09:00'}–${d.workdayEnd || '17:00'}`;
};

export const toAvailability = (d: ProfileData): Availability | undefined => {
  if (d.availableDays.length === 0) return undefined;

  return {
    source: 'manual',
    timezone: d.timezone.trim() || FALLBACK_TIMEZONE,
    days: d.availableDays,
    typicalWorkingWindow: {
      startsAt: d.workdayStart || '09:00',
      endsAt: d.workdayEnd || '17:00',
    },
    updatedAt: new Date(),
  };
};

const toPreferences = (d: ProfileData): UserPreferences => ({
  theme: d.theme,
  language: d.language,
  notifications: {
    email: d.emailNotifications,
    push: d.pushNotifications,
  },
});

const toUser = (roles: OnboardingRole[], d: ProfileData): NewUser => ({
  email: d.email.trim(),
  firstName: d.firstName.trim(),
  lastName: d.lastName.trim(),
  shortBio: d.shortBio.trim() || undefined,
  longBio: d.longBio.trim() || undefined,
  photoKey: d.photoKey || undefined,
  preferences: toPreferences(d),
  roles: roles.map((role) => ROLE_FOR[role]),
});

export const toEditor = (d: ProfileData): NewEditor => ({
  location: d.location.trim() || undefined,
  organizationId: d.organizationId || undefined,
  desks: d.desks,
  jobTitle: d.jobTitle.trim(),
  yearsAtDesk: d.yearsAtDesk,
  pitchPreferences: {
    preferredPitchFormat: d.preferredPitchFormat,
    averageResponseTime: d.averageResponseTime,
    interestedTopics: d.interestedTopics,
    editorialPreferences: d.editorialPreferences,
    lookingFor: d.lookingFor,
  },
  availability: toAvailability(d),
});

export const toFreelancer = (d: ProfileData): NewFreelancer => ({
  location: d.location.trim() || undefined,
  rate: formatRate(d.rateAmount, d.rateUnit),
  communityCovered: d.communityCovered.trim() || undefined,
  reportingBeats: d.reportingBeats,
  beatTags: d.beatTags,
  workMediums: d.workMediums,
  tools: d.tools,
  portfolio: d.portfolio,
  availability: toAvailability(d),
});

/** Builds the payload to send to the API on submit, with a record per selected role */
export const toProfile = (roles: OnboardingRole[], d: ProfileData): OnboardingPayload => ({
  user: toUser(roles, d),
  roles,
  ...(roles.includes('editor') ? { editor: toEditor(d) } : {}),
  ...(roles.includes('freelancer') ? { freelancer: toFreelancer(d) } : {}),
});
