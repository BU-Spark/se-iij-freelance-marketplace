import { validatePassword, validatePasswordConfirmation } from '../../utils/password.utils';
import { isFreeEmailDomain, isValidEmail } from '../../utils/validation.utils';
import type { OrgAccount, OrgDetails } from './orgSignup';

export type OrgAccountErrors = Partial<Record<keyof OrgAccount, string>>;
export type OrgDetailsErrors = Partial<Record<keyof OrgDetails, string>>;

/** A domain, with or without the protocol people tend to leave off */
const WEBSITE_PATTERN = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}([/?#]\S*)?$/i;

/* Both are checked in the order the form asks, so the first error is also the first one on screen */

export function validateOrgAccount(account: OrgAccount): OrgAccountErrors {
  const errors: OrgAccountErrors = {};

  if (!account.contactName.trim()) errors.contactName = 'Enter your name';

  if (!isValidEmail(account.email.trim())) errors.email = 'Enter a valid email address';
  else if (isFreeEmailDomain(account.email)) errors.email = 'Use your work email, not a personal inbox';

  const password = validatePassword(account.password);
  if (password) errors.password = password;

  const confirmation = validatePasswordConfirmation(account.password, account.confirmPassword);
  if (confirmation) errors.confirmPassword = confirmation;

  return errors;
}

export function validateOrgDetails(details: OrgDetails): OrgDetailsErrors {
  const errors: OrgDetailsErrors = {};

  if (!details.name.trim()) errors.name = 'Enter your organization’s name';
  if (!WEBSITE_PATTERN.test(details.website.trim())) errors.website = 'Enter a website, e.g. meridianpost.com';
  if (!details.city.trim()) errors.city = 'Enter a city, or “Remote”';
  if (!details.tagline.trim()) errors.tagline = 'Add a one-line tagline';
  if (!details.bio.trim()) errors.bio = 'Tell freelancers about your newsroom';
  if (details.beats.length === 0) errors.beats = 'Pick at least one beat';

  return errors;
}
