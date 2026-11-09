import Link from 'next/link';
import { IIJLogo } from './components';
import styles from './page.module.css';

const FEATURES = [
  { label: 'Post & find assignments', color: 'var(--c-green)' },
  { label: 'Pitch to real editors', color: 'var(--c-amber)' },
  { label: 'Get paid for your work', color: 'var(--c-purple)' },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.blobs} aria-hidden="true">
        <span style={{ background: 'var(--c-green)' }} />
        <span style={{ background: 'var(--c-yellow)' }} />
        <span style={{ background: 'var(--c-pink)' }} />
        <span style={{ background: 'var(--c-sky)' }} />
      </div>

      <section className={styles.hero}>
        <div className={styles.logoWrap}>
          <IIJLogo size={190} />
        </div>

        <p className={styles.eyebrow}>The freelance assignment desk</p>

        <h1 className={styles.title}>
          Welcome to the
          <br />
          <span className={styles.highlight}>StoryMatch</span>
        </h1>

        <p className={styles.subtitle}>
          Where newsroom editors meet the independent journalists who can take the work. Set up your profile in under
          two minutes.
        </p>

        <Link href="/signup" className={styles.cta}>
          <span>Let&apos;s get started</span>
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </Link>

        <p className={styles.loginPrompt}>
          Already have an account? <Link href="/login">Log in</Link>
        </p>

        <ul className={styles.features}>
          {FEATURES.map((f, i) => (
            <li key={f.label} style={{ animationDelay: `${700 + i * 120}ms` }}>
              <span className={styles.dot} style={{ background: f.color }} />
              {f.label}
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.rainbowBar} aria-hidden="true" />
    </main>
  );
}
