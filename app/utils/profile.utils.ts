import { Role } from '../types/user.types';
import type { Availability, Weekday } from '../types/availability.types';
import type { RateUnit } from '../types/dashboard.types';
import type { NewEditor, NewFreelancer, NewUser, OnboardingRole, ProfileData } from '../types/onboarding.types';
import type { UserPreferences } from '../types/user.types';

const ROLE_FOR: Record<OnboardingRole, Role> = {
  editor: Role.EDITOR,
  // TODO: confirm with data design, there's no FREELANCER role yet
  freelancer: Role.USER,
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

const toUser = (role: OnboardingRole, d: ProfileData): NewUser => ({
  email: d.email.trim(),
  firstName: d.firstName.trim(),
  lastName: d.lastName.trim(),
  shortBio: d.shortBio.trim() || undefined,
  longBio: d.longBio.trim() || undefined,
  preferences: toPreferences(d),
  roles: [ROLE_FOR[role]],
});

export const toEditor = (d: ProfileData): NewEditor => ({
  user: toUser('editor', d),
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
  user: toUser('freelancer', d),
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

/** Builds the payload to send to the API on submit */
export const toProfile = (role: OnboardingRole, d: ProfileData) => (role === 'editor' ? toEditor(d) : toFreelancer(d));
