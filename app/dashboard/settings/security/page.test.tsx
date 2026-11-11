import { render, screen } from '@testing-library/react';
import { useClerk, useUser } from '@clerk/nextjs';
import SignInSettingsPage from './page';
import { ToastProvider } from '../../../components/Toast/ToastProvider';
import { MOCK_PROFILE } from '../../../components/Profile/config/constants';

jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn(), useClerk: jest.fn() }));
jest.mock('../../../hooks/useProfile', () => ({
  useProfile: () => ({ profile: MOCK_PROFILE }),
}));

const user = jest.mocked(useUser);
const clerk = jest.mocked(useClerk);

const renderPage = () =>
  render(
    <ToastProvider>
      <SignInSettingsPage />
    </ToastProvider>
  );

beforeEach(() => {
  user.mockReturnValue({
    user: {
      passwordEnabled: true,
      primaryEmailAddress: { emailAddress: 'marina@example.com', verification: { status: 'verified' } },
      // the session list is not this page's concern; a promise that never settles keeps it out of the way
      getSessions: jest.fn(() => new Promise<never[]>(() => {})),
    },
    isLoaded: true,
  } as unknown as ReturnType<typeof useUser>);

  clerk.mockReturnValue({
    signOut: jest.fn(),
    openUserProfile: jest.fn(),
    session: { id: 'sess-1' },
  } as unknown as ReturnType<typeof useClerk>);
});

describe('Settings sign-in page', () => {
  it('shows the sign-in and security cards', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 2, name: 'Sign-in & security' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign-in email' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Password' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "Where you're signed in" })).toBeInTheDocument();
  });

  it('does not repeat the profile cards', () => {
    renderPage();

    expect(screen.queryByText('Basic info')).not.toBeInTheDocument();
    expect(screen.queryByText('My roles')).not.toBeInTheDocument();
  });
});
