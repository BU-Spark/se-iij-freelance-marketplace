import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useClerk, useUser } from '@clerk/nextjs';
import AccountSettings from './AccountSettings';
import { ToastProvider } from '../Toast/ToastProvider';

jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn(), useClerk: jest.fn() }));

const user = jest.mocked(useUser);
const clerk = jest.mocked(useClerk);

const makeSession = (id: string, browserName: string) => ({
  id,
  lastActiveAt: new Date('2026-11-01T10:00:00Z'),
  latestActivity: { browserName, city: 'London', country: 'GB' },
  revoke: jest.fn().mockResolvedValue(undefined),
});

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  passwordEnabled: true,
  primaryEmailAddress: {
    emailAddress: 'marina@example.com',
    verification: { status: 'verified' },
  },
  getSessions: jest.fn().mockResolvedValue([]),
  updatePassword: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const signOut = jest.fn();

/**
 * Renders with the Clerk hooks mocked. The session list loads in an effect, so the render is
 * flushed before returning to keep those state updates inside act().
 */
const renderAccount = async (details = makeUser()) => {
  user.mockReturnValue({ user: details, isLoaded: true } as unknown as ReturnType<typeof useUser>);
  clerk.mockReturnValue({
    signOut,
    session: { id: 'sess-current' },
  } as unknown as ReturnType<typeof useClerk>);

  render(
    <ToastProvider>
      <AccountSettings fallbackEmail="fallback@example.com" />
    </ToastProvider>
  );

  await act(async () => {});
  return details;
};

beforeEach(() => {
  user.mockReset();
  clerk.mockReset();
  signOut.mockReset();
});

describe('AccountSettings', () => {
  it('shows the primary email and its verification', async () => {
    await renderAccount();

    expect(screen.getByText('marina@example.com')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('falls back to the profile email while Clerk has not answered', async () => {
    user.mockReturnValue({ user: null, isLoaded: false } as unknown as ReturnType<typeof useUser>);
    clerk.mockReturnValue({
      signOut,
      session: null,
    } as unknown as ReturnType<typeof useClerk>);

    render(
      <ToastProvider>
        <AccountSettings fallbackEmail="fallback@example.com" />
      </ToastProvider>
    );

    expect(screen.getByText('fallback@example.com')).toBeInTheDocument();
  });

  it('changes the password with the current one', async () => {
    const details = await renderAccount();

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
    const details = await renderAccount(makeUser({ passwordEnabled: false }));

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
    const details = await renderAccount();

    fireEvent.click(screen.getByRole('button', { name: 'Change password' }));
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }));

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument();
    expect(details.updatePassword).not.toHaveBeenCalled();
  });

  it('surfaces the Clerk error when the password is rejected', async () => {
    const details = await renderAccount(
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

  it('lists the signed-in devices and marks the current one', async () => {
    const current = makeSession('sess-current', 'Chrome');
    const other = makeSession('sess-other', 'Safari');
    await renderAccount(makeUser({ getSessions: jest.fn().mockResolvedValue([current, other]) }));

    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(screen.getByText('Safari')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.getAllByText(/London, GB/)).toHaveLength(2);
  });

  it('signs out a single other device', async () => {
    const current = makeSession('sess-current', 'Chrome');
    const other = makeSession('sess-other', 'Safari');
    await renderAccount(makeUser({ getSessions: jest.fn().mockResolvedValue([current, other]) }));

    fireEvent.click(screen.getByRole('button', { name: 'Sign out of Safari' }));

    await waitFor(() => expect(other.revoke).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Safari')).not.toBeInTheDocument());
    expect(screen.getByText('Chrome')).toBeInTheDocument();
    expect(current.revoke).not.toHaveBeenCalled();
  });

  it('signs out every other device at once', async () => {
    const current = makeSession('sess-current', 'Chrome');
    const other = makeSession('sess-other', 'Safari');
    await renderAccount(makeUser({ getSessions: jest.fn().mockResolvedValue([current, other]) }));

    fireEvent.click(screen.getByRole('button', { name: 'Sign out other devices' }));

    await waitFor(() => expect(other.revoke).toHaveBeenCalledTimes(1));
    expect(current.revoke).not.toHaveBeenCalled();
    expect(await screen.findByText('Signed out of your other devices')).toBeInTheDocument();
  });

  it('signs out of this device from the danger card', async () => {
    await renderAccount();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(signOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });
});
