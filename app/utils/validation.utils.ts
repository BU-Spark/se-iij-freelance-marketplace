import type { ProfileData, ProfileErrors, Role } from '../types/onboarding.types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/\S+\.\S+/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);

export const isValidUrl = (url: string) => URL_PATTERN.test(url);

function validateBasics(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (d.fullName.trim().length < 2) e.fullName = 'Please enter your full name';
  if (!isValidEmail(d.email)) e.email = 'Enter a valid email address';
  return e;
}

function validateEditor(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (!d.title.trim()) e.title = "What's your position?";
  if (d.desks.length === 0) e.desks = 'Pick at least one desk';
  return e;
}

function validateFreelancer(d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (d.beats.length === 0) e.beats = 'Pick at least one beat';
  if (d.mediums.length === 0) e.mediums = 'Pick at least one medium';
  if (d.portfolio && !isValidUrl(d.portfolio)) e.portfolio = 'Link should start with http:// or https://';
  return e;
}

export function validateProfile(role: Role, d: ProfileData): ProfileErrors {
  const roleErrors = role === 'editor' ? validateEditor(d) : validateFreelancer(d);
  return { ...validateBasics(d), ...roleErrors };
}
