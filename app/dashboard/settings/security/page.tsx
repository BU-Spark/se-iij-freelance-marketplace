'use client';

import AccountSettings from '../../../components/AccountSettings/AccountSettings';
import { useProfile } from '../../../hooks/useProfile';
import styles from '../settings.module.css';

/**
 * Settings → Sign-in & security. Everything here is Clerk's, so none of it is mixed into the
 * profile page: email, password, the signed-in devices, and signing out.
 */
export default function SignInSettingsPage() {
  const { profile } = useProfile();

  return (
    <section aria-labelledby="sign-in-heading">
      <div className={styles.sectionHead}>
        <h2 id="sign-in-heading">Sign-in &amp; security</h2>
        <p>Your email, password and the devices that are currently signed in.</p>
      </div>

      <AccountSettings fallbackEmail={profile?.basic.email} />
    </section>
  );
}
