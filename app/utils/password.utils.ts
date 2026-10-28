/**
 * password.utils.ts
 *
 * Pure password validation shared by account forms. Keeping the rules here
 * means every form enforces (and words) the same constraints.
 */

export const MIN_PASSWORD_LENGTH = 15;

export function validatePassword(password: string): string | undefined {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return undefined;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | undefined {
  if (!confirmation) return 'Re-enter your password.';
  if (confirmation !== password) return 'Passwords do not match.';
  return undefined;
}
