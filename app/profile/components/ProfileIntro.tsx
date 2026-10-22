import Link from 'next/link';
import styles from '../profile.module.css';

export function ProfileIntro() {
  return (
    <header className={styles.intro}>
      <Link href="/onboarding" className={styles.changeRole}>
        ← Change role
      </Link>
      <p className={styles.role}>Editor</p>
      <h1>Build your profile</h1>
      <p className={styles.lead}>Freelancers see this when they&apos;re deciding whether to pitch you.</p>
    </header>
  );
}
