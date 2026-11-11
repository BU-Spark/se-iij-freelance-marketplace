'use client';

import { useUser } from '@clerk/nextjs';
import styles from './AccountSettings.module.css';

type AccountSettingsProps = {
  /** Shown until Clerk hands back the signed-in user, so the card is never blank */
  fallbackEmail?: string;
};

/**
 * The sign-in side of settings: which email signs you in. The password and the devices that are
 * signed in build on this same stack.
 */
export default function AccountSettings({ fallbackEmail }: AccountSettingsProps) {
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress ?? fallbackEmail ?? '';
  const emailVerified = user?.primaryEmailAddress?.verification?.status === 'verified';

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
    </div>
  );
}
