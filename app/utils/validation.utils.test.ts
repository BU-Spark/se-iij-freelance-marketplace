import { ageFrom, MINIMUM_AGE, validateAge } from './validation.utils';

describe('ageFrom', () => {
  // a fixed "today" so the assertions do not drift
  const today = new Date(2026, 10, 8);

  it('counts whole years', () => {
    expect(ageFrom('1990-01-01', today)).toBe(36);
  });

  it('counts the birthday itself', () => {
    expect(ageFrom('2008-11-08', today)).toBe(18);
  });

  it('is a year younger the day before the birthday', () => {
    expect(ageFrom('2008-11-09', today)).toBe(17);
  });

  it('handles a leap-day birthday', () => {
    expect(ageFrom('2008-02-29', today)).toBe(18);
  });

  it('rejects a missing, unparseable or future date', () => {
    expect(ageFrom('', today)).toBeNull();
    expect(ageFrom('not-a-date', today)).toBeNull();
    expect(ageFrom('2027-01-01', today)).toBeNull();
  });
});

describe('validateAge', () => {
  it('asks for the date when it is missing', () => {
    expect(validateAge({ dateOfBirth: '' })).toEqual({ dateOfBirth: 'Enter your date of birth' });
  });

  it('refuses anyone under the minimum age', () => {
    expect(validateAge({ dateOfBirth: '2015-01-01' }).dateOfBirth).toContain(`${MINIMUM_AGE} or older`);
  });

  it('accepts an adult', () => {
    expect(validateAge({ dateOfBirth: '1990-01-01' })).toEqual({});
  });
});
