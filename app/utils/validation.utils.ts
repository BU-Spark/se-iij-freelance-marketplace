import type { OnboardingRole, ProfileData, ProfileErrors } from '../types/onboarding.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);

export const isValidUrl = (url: string) => URL_PATTERN.test(url);

function validateBasics(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (!d.firstName.trim()) e.firstName = 'Please enter your first name';
  if (!d.lastName.trim()) e.lastName = 'Please enter your last name';
  if (!isValidEmail(d.email)) e.email = 'Enter a valid email address';
  return e;
}

function validateEditor(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
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

export function validateProfile(role: OnboardingRole, d: ProfileData): ProfileErrors {
  const roleErrors = role === 'editor' ? validateEditor(d) : validateFreelancer(d);
  return { ...validateBasics(d), ...roleErrors };
}
