import { EMPTY_ACCOUNT, EMPTY_DETAILS, type OrgAccount, type OrgDetails } from './orgSignup';
import { validateOrgAccount, validateOrgDetails } from './orgSignup.validation';

const account: OrgAccount = {
  contactName: 'Sam Rivera',
  email: 'sam@signalroom.org',
  password: 'correct-horse-battery',
  confirmPassword: 'correct-horse-battery',
};

const details: OrgDetails = {
  ...EMPTY_DETAILS,
  name: 'Signal Room',
  website: 'signalroom.org',
  city: 'Remote',
  tagline: 'Technology and public life',
  bio: 'A nonprofit newsroom.',
  beats: ['Tech'],
};

describe('validateOrgAccount', () => {
  it('accepts a complete account', () => {
    expect(validateOrgAccount(account)).toEqual({});
  });

  it('asks for every field, in form order', () => {
    expect(Object.keys(validateOrgAccount(EMPTY_ACCOUNT))).toEqual([
      'contactName',
      'email',
      'password',
      'confirmPassword',
    ]);
  });

  it('turns away personal inboxes', () => {
    expect(validateOrgAccount({ ...account, email: 'sam@gmail.com' }).email).toMatch(/work email/i);
  });

  it('requires the passwords to match', () => {
    expect(validateOrgAccount({ ...account, confirmPassword: 'something-else' }).confirmPassword).toBeDefined();
  });
});

describe('validateOrgDetails', () => {
  it('accepts complete details, with the rate left blank', () => {
    expect(validateOrgDetails(details)).toEqual({});
  });

  it('asks for every required field, in form order', () => {
    expect(Object.keys(validateOrgDetails(EMPTY_DETAILS))).toEqual([
      'name',
      'website',
      'city',
      'tagline',
      'bio',
      'beats',
    ]);
  });

  it.each(['signalroom.org', 'https://www.signalroom.org/about', ' http://news.signalroom.co.uk '])(
    'accepts the website %s',
    (website) => {
      expect(validateOrgDetails({ ...details, website }).website).toBeUndefined();
    }
  );

  it.each(['signalroom', 'signal room.org', 'ftp://signalroom.org'])('rejects the website %s', (website) => {
    expect(validateOrgDetails({ ...details, website }).website).toMatch(/enter a website/i);
  });
});
