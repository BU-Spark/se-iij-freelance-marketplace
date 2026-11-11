'use client';

import { useState, type FormEvent } from 'react';
import { useUser } from '@clerk/nextjs';
import PasswordField from '../PasswordField/PasswordField';
import { useToast } from '../Toast/ToastProvider';
import styles from './AccountSettings.module.css';

/** Clerk throws `{ errors: [{ longMessage }] }`; anything else falls back to the plain message */
const clerkMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object' && 'errors' in error) {
    const errors = (error as { errors?: { longMessage?: string; message?: string }[] }).errors;
    const first = errors?.[0];
    if (first?.longMessage || first?.message) return first.longMessage ?? first.message ?? fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

type AccountSettingsProps = {
  /** Shown until Clerk hands back the signed-in user, so the card is never blank */
  fallbackEmail?: string;
};

/**
 * The sign-in side of settings: which email signs you in and the password behind it. The devices
 * that are signed in build on this same stack.
 */
export default function AccountSettings({ fallbackEmail }: AccountSettingsProps) {
  const { user } = useUser();
  const { showToast } = useToast();

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const passwordEnabled = user?.passwordEnabled ?? false;
  const email = user?.primaryEmailAddress?.emailAddress ?? fallbackEmail ?? '';
  const emailVerified = user?.primaryEmailAddress?.verification?.status === 'verified';

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
    } catch (error) {
      setFormError(clerkMessage(error, 'Could not update your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

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
    </div>
  );
}
