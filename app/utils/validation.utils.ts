import type { OnboardingRole, ProfileData, ProfileErrors, Step } from '../types/onboarding.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);

/** Consumer inboxes don't prove a newsroom; Clerk has no opinion, so the app draws the line */
const FREE_EMAIL_DOMAINS =
  /@(aol|fastmail|gmail|googlemail|gmx|hey|hotmail|icloud|live|mac|mail|me|msn|outlook|proton|protonmail|yahoo|ymail|yandex|zoho)\.[a-z.]+$/i;

export const isFreeEmailDomain = (email: string) => FREE_EMAIL_DOMAINS.test(email.trim());

export const isValidUrl = (url: string) => URL_PATTERN.test(url);

export const MINIMUM_AGE = 18;

/** Whole years old on `today`; null when the value is not a date or is in the future */
export function ageFrom(dateOfBirth: string, today: Date = new Date()): number | null {
  if (!dateOfBirth) return null;

  // parsed as local midnight so the birthday never shifts across time zones
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth.getTime() > today.getTime()) return null;

  const years = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  return beforeBirthday ? years - 1 : years;
}

/** The 18+ gate; the date of birth itself is never part of what onboarding saves */
export function validateAge(d: Pick<ProfileData, 'dateOfBirth'>): ProfileErrors {
  if (!d.dateOfBirth) return { dateOfBirth: 'Enter your date of birth' };

  const age = ageFrom(d.dateOfBirth);
  if (age === null) return { dateOfBirth: 'Enter a valid date of birth' };
  if (age < MINIMUM_AGE) return { dateOfBirth: `You must be ${MINIMUM_AGE} or older to join the desk` };

  return {};
}

function validateBasics(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (!d.firstName.trim()) e.firstName = 'Please enter your first name';
  if (!d.lastName.trim()) e.lastName = 'Please enter your last name';
  if (!isValidEmail(d.email)) e.email = 'Enter a valid email address';
  return e;
}

function validateEditor(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  // the work email is only accepted once its one-time code has been confirmed
  if (!d.businessEmailVerified && isValidEmail(d.email)) e.email = 'Verify your work email to continue';
  if (isFreeEmailDomain(d.email)) e.email = 'Use your work email, not a personal inbox';
  if (!d.jobTitle.trim()) e.jobTitle = "What's your position?";
  if (d.yearsAtDesk < 0) e.yearsAtDesk = "Years can't be negative";
  if (d.desks.length === 0) e.desks = 'Pick at least one desk';
  return e;
}

function validateFreelancer(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (d.reportingBeats.length === 0) e.reportingBeats = 'Pick at least one beat';
  if (d.workMediums.length === 0) e.workMediums = 'Pick at least one medium';
  if (d.portfolio.some((item) => !isValidUrl(item.url))) e.portfolio = 'Link should start with http:// or https://';
  return e;
}

/** Everything on the preferences step is optional, but provided values still have to make sense */
function validatePreferences(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  const rate = d.rateAmount.trim();

  if (rate && !(Number.isFinite(Number(rate)) && Number(rate) >= 0)) e.rateAmount = 'Enter a number, e.g. 0.75';
  if (d.averageResponseTime < 0) e.averageResponseTime = "Response time can't be negative";
  if (d.availableDays.length > 0 && d.workdayStart && d.workdayEnd && d.workdayStart >= d.workdayEnd) {
    e.workdayEnd = 'End time must be after the start time';
  }
  return e;
}

export const ROLE_REQUIRED = 'Pick at least one role';

export function validateRoleSelection(roles: OnboardingRole[]): ProfileErrors {
  return roles.length > 0 ? {} : { roles: ROLE_REQUIRED };
}

/** Every rule that applies to the roles the user picked; used on the final submit */
export function validateProfile(roles: OnboardingRole[], d: ProfileData, requireAge = true): ProfileErrors {
  return {
    ...(requireAge ? validateAge(d) : {}),
    ...validateBasics(d),
    ...(roles.includes('editor') ? validateEditor(d) : {}),
    ...(roles.includes('freelancer') ? validateFreelancer(d) : {}),
    ...validatePreferences(d),
  };
}

/** Only what the current step renders, so Continue is never blocked by another role's blanks */
export function validateStep(step: Step, roles: OnboardingRole[], d: ProfileData): ProfileErrors {
  switch (step) {
    case 'role':
      return validateRoleSelection(roles);
    case 'age':
      return validateAge(d);
    case 'editor-profile':
      return { ...validateBasics(d), ...validateEditor(d) };
    case 'freelancer-profile':
      return { ...validateBasics(d), ...validateFreelancer(d) };
    case 'editor-preferences':
    case 'freelancer-preferences':
      return validatePreferences(d);
    case 'done':
      return {};
  }
}
