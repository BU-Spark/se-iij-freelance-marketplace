import { render, screen } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import AccountSettings from './AccountSettings';

jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn() }));

const user = jest.mocked(useUser);

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  primaryEmailAddress: {
    emailAddress: 'marina@example.com',
    verification: { status: 'verified' },
  },
  ...overrides,
});

const renderAccount = (details = makeUser()) => {
  user.mockReturnValue({ user: details, isLoaded: true } as unknown as ReturnType<typeof useUser>);

  render(<AccountSettings fallbackEmail="fallback@example.com" />);

  return details;
};

beforeEach(() => {
  user.mockReset();
});

describe('AccountSettings', () => {
  it('shows the primary email and its verification', () => {
    renderAccount();

    expect(screen.getByText('marina@example.com')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('marks an unverified address', () => {
    renderAccount(makeUser({ primaryEmailAddress: { emailAddress: 'marina@example.com', verification: {} } }));

    expect(screen.getByText('Not verified yet')).toBeInTheDocument();
  });

  it('falls back to the profile email while Clerk has not answered', () => {
    user.mockReturnValue({ user: null, isLoaded: false } as unknown as ReturnType<typeof useUser>);

    render(<AccountSettings fallbackEmail="fallback@example.com" />);

    expect(screen.getByText('fallback@example.com')).toBeInTheDocument();
  });
});
