import { MIN_PASSWORD_LENGTH, validatePassword, validatePasswordConfirmation } from './password.utils';

describe('validatePassword', () => {
  it('rejects passwords shorter than the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH - 1))).toBe(
      `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    );
  });

  it('accepts passwords at the minimum length', () => {
    expect(validatePassword('a'.repeat(MIN_PASSWORD_LENGTH))).toBeUndefined();
  });
});

describe('validatePasswordConfirmation', () => {
  it('requires the password to be entered twice', () => {
    expect(validatePasswordConfirmation('correct-horse', '')).toBe('Re-enter your password.');
  });

  it('rejects a confirmation that does not match', () => {
    expect(validatePasswordConfirmation('correct-horse', 'wrong-horse')).toBe('Passwords do not match.');
  });

  it('accepts a matching confirmation', () => {
    expect(validatePasswordConfirmation('correct-horse', 'correct-horse')).toBeUndefined();
  });
});
