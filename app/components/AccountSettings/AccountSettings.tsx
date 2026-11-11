'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import PasswordField from '../PasswordField/PasswordField';
import { useToast } from '../Toast/ToastProvider';
import styles from './AccountSettings.module.css';

/** Shapes taken from the Clerk resources, so nothing here imports Clerk's internal types */
type ClerkUser = NonNullable<ReturnType<typeof useUser>['user']>;
type ClerkSession = Awaited<ReturnType<ClerkUser['getSessions']>>[number];

const LAST_ACTIVE = { month: 'short', day: 'numeric', year: 'numeric' } as const;

/** Clerk throws `{ errors: [{ longMessage }] }`; anything else falls back to the plain message */
const clerkMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: { longMessage?: string; message?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.longMessage || first?.message) return first.longMessage ?? first.message ?? fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const sessionName = (session: ClerkSession): string => {
  const activity = session.latestActivity;
  const browser = activity?.browserName?.trim();
  const device = activity?.deviceType?.trim();
  if (browser) return browser;
  if (device && device !== 'browser') return device;
  return 'Unknown device';
};

const sessionMeta = (session: ClerkSession): string => {
  const activity = session.latestActivity;
  const place = [activity?.city, activity?.country].filter(Boolean).join(', ');
  const when = session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleDateString('en-US', LAST_ACTIVE) : '';
  return [place, when && `Last active ${when}`].filter(Boolean).join(' · ');
};

type AccountSettingsProps = {
  /** Shown until Clerk hands back the signed-in user, so the card is never blank */
  fallbackEmail?: string;
};

/**
 * The sign-in side of settings: which email signs you in, the password, and the devices that are
 * signed in. Everything here is Clerk's, so the email itself is shown but not edited here.
 */
export default function AccountSettings({ fallbackEmail }: AccountSettingsProps) {
  const { user } = useUser();
  const { signOut, session } = useClerk();
  const { showToast } = useToast();

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [sessions, setSessions] = useState<ClerkSession[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [busySession, setBusySession] = useState<string | null>(null);
  const [signingOutOthers, setSigningOutOthers] = useState(false);

  const currentSessionId = session?.id;
  const passwordEnabled = user?.passwordEnabled ?? false;
  const email = user?.primaryEmailAddress?.emailAddress ?? fallbackEmail ?? '';
  const emailVerified = user?.primaryEmailAddress?.verification?.status === 'verified';

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setSessionsError(null);
    try {
      setSessions(await user.getSessions());
    } catch {
      setSessionsError('Could not load the devices you are signed in on.');
    }
  }, [user]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const resetPasswordForm = () => {
    setEditingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSignOutOthers(true);
    setFormError(null);
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    if (newPassword.length < 8) {
      setFormError('Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('The new passwords do not match.');
      return;
    }

    setFormError(null);
    setSaving(true);

    try {
      await user.updatePassword({
        ...(passwordEnabled ? { currentPassword } : {}),
        newPassword,
        signOutOfOtherSessions: signOutOthers,
      });

      showToast(passwordEnabled ? 'Password updated' : 'Password set', 'success');
      resetPasswordForm();

      // other sessions may just have been ended, so the list would be stale
      if (signOutOthers) void loadSessions();
    } catch (error) {
      setFormError(clerkMessage(error, 'Could not update your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const revokeSession = async (target: ClerkSession) => {
    setBusySession(target.id);
    try {
      await target.revoke();
      setSessions((list) => list.filter((item) => item.id !== target.id));
      showToast('Signed out of that device', 'success');
    } catch (error) {
      showToast(clerkMessage(error, 'Could not sign out of that device.'), 'error');
    } finally {
      setBusySession(null);
    }
  };

  const revokeOthers = async () => {
    const others = sessions.filter((item) => item.id !== currentSessionId);
    if (others.length === 0) return;

    setSigningOutOthers(true);
    try {
      await Promise.all(others.map((item) => item.revoke()));
      setSessions((list) => list.filter((item) => item.id === currentSessionId));
      showToast('Signed out of your other devices', 'success');
    } catch (error) {
      showToast(clerkMessage(error, 'Could not sign out of your other devices.'), 'error');
      void loadSessions();
    } finally {
      setSigningOutOthers(false);
    }
  };

  const othersCount = sessions.filter((item) => item.id !== currentSessionId).length;

  return (
    <div className={styles.stack}>
      <section className={styles.card} aria-labelledby="account-email-title">
        <div className={styles.cardHead}>
          <div>
            <h3 id="account-email-title" className={styles.cardTitle}>
              Sign-in email
            </h3>
            <p className={styles.cardHint}>The address you use to sign in and to receive notifications from us.</p>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.rowIcon} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className={styles.rowBody}>
            <span className={styles.rowValue}>{email || 'Loading your account…'}</span>
            {email && (
              <span className={styles.badges}>
                <span className={styles.badge}>Primary</span>
                <span className={emailVerified ? `${styles.badge} ${styles.badgeOk}` : styles.badge}>
                  {emailVerified ? 'Verified' : 'Not verified yet'}
                </span>
              </span>
            )}
          </span>
        </div>
      </section>

      <section className={styles.card} aria-labelledby="account-password-title">
        <div className={styles.cardHead}>
          <div>
            <h3 id="account-password-title" className={styles.cardTitle}>
              Password
            </h3>
            <p className={styles.cardHint}>
              {passwordEnabled
                ? 'Change the password you use to sign in.'
                : 'Your account signs in with another method. Set a password to sign in with email too.'}
            </p>
          </div>
          {!editingPassword && (
            <button type="button" className={styles.button} onClick={() => setEditingPassword(true)}>
              {passwordEnabled ? 'Change password' : 'Set a password'}
            </button>
          )}
        </div>

        {editingPassword && (
          <form className={styles.form} onSubmit={savePassword} noValidate>
            {passwordEnabled && (
              <PasswordField
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
            )}
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              hint="At least 8 characters."
              hintMet={newPassword.length >= 8}
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              error={
                confirmPassword.length > 0 && confirmPassword !== newPassword
                  ? 'The new passwords do not match.'
                  : undefined
              }
            />

            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={signOutOthers}
                onChange={(event) => setSignOutOthers(event.target.checked)}
              />
              <span>Sign out of my other devices</span>
            </label>

            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={resetPasswordForm} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={styles.buttonPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Save password'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.card} aria-labelledby="account-sessions-title">
        <div className={styles.cardHead}>
          <div>
            <h3 id="account-sessions-title" className={styles.cardTitle}>
              Where you&apos;re signed in
            </h3>
            <p className={styles.cardHint}>Devices with an open session. Sign out anything you do not recognise.</p>
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={() => void revokeOthers()}
            disabled={othersCount === 0 || signingOutOthers}
          >
            {signingOutOthers ? 'Signing out…' : 'Sign out other devices'}
          </button>
        </div>

        {sessionsError ? (
          <p className={styles.formError} role="status">
            {sessionsError}
          </p>
        ) : sessions.length === 0 ? (
          <p className={styles.cardHint} role="status">
            Loading your sessions…
          </p>
        ) : (
          <ul className={styles.sessionList}>
            {sessions.map((item) => {
              const current = item.id === currentSessionId;
              return (
                <li key={item.id} className={current ? `${styles.session} ${styles.currentSession}` : styles.session}>
                  <span className={styles.rowIcon} aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="12" rx="2" />
                      <path d="M8 20h8M12 16v4" />
                    </svg>
                  </span>
                  <span className={styles.rowBody}>
                    <span className={styles.rowValue}>{sessionName(item)}</span>
                    <span className={styles.rowMeta}>{sessionMeta(item)}</span>
                  </span>
                  {current ? (
                    <span className={`${styles.badge} ${styles.badgeOk}`}>This device</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.buttonSmall}
                      onClick={() => void revokeSession(item)}
                      disabled={busySession === item.id}
                      aria-label={`Sign out of ${sessionName(item)}`}
                    >
                      {busySession === item.id ? 'Signing out…' : 'Sign out'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`} aria-labelledby="account-signout-title">
        <div className={styles.cardHead}>
          <div>
            <h3 id="account-signout-title" className={styles.cardTitle}>
              Sign out
            </h3>
            <p className={styles.cardHint}>End this session on this device. Your profile and pitches are kept.</p>
          </div>
          <button type="button" className={styles.dangerButton} onClick={() => signOut({ redirectUrl: '/' })}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
