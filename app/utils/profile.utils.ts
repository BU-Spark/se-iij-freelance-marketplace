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
import type { AccountProfile, BasicInfo, ProfileRole, RoleValue } from '../types/profile.types';
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
/*  Panel edits -> validated values                                    */
/* ------------------------------------------------------------------ */

const EMAIL = /^\S+@\S+\.\S+$/;

export type BasicErrors = Partial<Record<'firstName' | 'email', string>>;

/** Only a first name and a usable email are required; the rest can stay blank */
export function validateBasic(basic: BasicInfo): BasicErrors {
  const errors: BasicErrors = {};
  if (!basic.firstName.trim()) errors.firstName = 'Add your first name.';
  if (!EMAIL.test(basic.email.trim())) errors.email = 'Enter a valid email address.';
  return errors;
}
const ROLE_FOR: Record<OnboardingRole, Role> = {
  editor: Role.EDITOR,
  freelancer: Role.FREELANCER,
};

const FALLBACK_TIMEZONE = 'UTC';
const DAY_ORDER: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
