import Link from 'next/link';
import { PITCHES, PITCH_STATUS_LABEL } from '../../pitches/constants';
import { categoryColor } from '../../../utils/category.utils';
import { timeAgo } from '../../../utils/dashboard.utils';
import { DEMO_FREELANCER_ID } from './constants';
import styles from './myPitches.module.css';

export default function MyPitchesPage() {
  const pitches = PITCHES.filter((pitch) => pitch.freelancer.id === DEMO_FREELANCER_ID);

  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Freelancer workspace</p>
            <h1 className={styles.title}>My pitches</h1>
            <p className={styles.lede}>Track your submitted story ideas and read the editor&apos;s feedback.</p>
          </div>
        </header>

        {pitches.length ? (
          <ul className={styles.list}>
            {pitches.map((pitch) => (
              <li key={pitch.id}>
                <Link href={`/dashboard/freelancer/pitches/${pitch.id}`} className={styles.card}>
                  <span className={styles.top}>
                    <span className={styles.category}>
                      <span
                        className={styles.dot}
                        style={{ background: categoryColor(pitch.category) }}
                        aria-hidden="true"
                      />
                      {pitch.category}
                    </span>
                    <span className={`${styles.pill} ${styles[pitch.status]}`}>{PITCH_STATUS_LABEL[pitch.status]}</span>
                  </span>
                  <span className={styles.slug}>{pitch.slug}</span>
                  <span className={styles.summary}>{pitch.summary}</span>
                  <span className={styles.footer}>
                    <span className={styles.meta}>Submitted {timeAgo(pitch.submittedAt)}</span>
                    <span className={styles.more}>View pitch and feedback →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.panel}>
            You haven&apos;t submitted a pitch yet. <Link href="/dashboard/freelancer/make-a-pitch">Make a pitch</Link>.
          </p>
        )}
      </main>
    </div>
  );
}
