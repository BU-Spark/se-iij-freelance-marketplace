import Link from 'next/link';
import styles from './layout.module.css';

/**
 * Shown instead of the desk when the profile check itself failed. Rendering the dashboard would
 * let someone past onboarding; sending them to onboarding would be a lie when they have already
 * finished it. So say what happened and offer a retry.
 */
export default function ProfileUnavailable() {
  return (
    <div className={styles.workspace}>
      <div className={styles.page}>
        <section className={styles.unavailable} role="alert" aria-labelledby="profile-unavailable-title">
          <h1 id="profile-unavailable-title">We couldn&apos;t load your account</h1>
          <p>
            Your profile is safe — we just couldn&apos;t read it. This is usually a temporary database problem, so
            please try again in a moment.
          </p>
          <Link href="/dashboard" className={styles.retry}>
            Try again
          </Link>
        </section>
      </div>
    </div>
  );
}
