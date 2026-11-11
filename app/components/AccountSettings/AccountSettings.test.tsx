import { fireEvent, render, screen } from '@testing-library/react';
import { useUser } from '@clerk/nextjs';
import AccountSettings from './AccountSettings';
import { ToastProvider } from '../Toast/ToastProvider';

jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn() }));

const user = jest.mocked(useUser);

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  passwordEnabled: true,
  primaryEmailAddress: {
    emailAddress: 'marina@example.com',
    verification: { status: 'verified' },
  },
  updatePassword: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const renderAccount = (details = makeUser()) => {
  user.mockReturnValue({ user: details, isLoaded: true } as unknown as ReturnType<typeof useUser>);

  render(
    <ToastProvider>
      <AccountSettings fallbackEmail="fallback@example.com" />
    </ToastProvider>
  );

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

    render(
      <ToastProvider>
        <AccountSettings fallbackEmail="fallback@example.com" />
      </ToastProvider>
    );

    expect(screen.getByText('fallback@example.com')).toBeInTheDocument();
  });

  it('changes the password with the current one', async () => {
    const details = renderAccount();

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'old-pass-123' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('Password updated')).toBeInTheDocument();
    expect(details.updatePassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass-123',
      newPassword: 'new-pass-123',
      signOutOfOtherSessions: true,
    });
    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();
  });

  it('sets a first password without asking for a current one', async () => {
    const details = renderAccount(makeUser({ passwordEnabled: false }));

    fireEvent.click(screen.getByRole('button', { name: 'Set a password' }));

    expect(screen.queryByLabelText('Current password')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('Password set')).toBeInTheDocument();
    expect(details.updatePassword).toHaveBeenCalledWith({
      newPassword: 'new-pass-123',
      signOutOfOtherSessions: true,
    });
  });

  it('keeps the form open and explains a too-short password', async () => {
    const details = renderAccount();

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(details.updatePassword).not.toHaveBeenCalled();
  });

  it('surfaces the Clerk error when the password is rejected', async () => {
    const details = renderAccount(
      makeUser({
        updatePassword: jest.fn().mockRejectedValue({ errors: [{ longMessage: 'Current password is incorrect.' }] }),
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'wrong-pass' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'new-pass-123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'new-pass-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('Current password is incorrect.')).toBeInTheDocument();
    expect(details.updatePassword).toHaveBeenCalled();
  });
});
