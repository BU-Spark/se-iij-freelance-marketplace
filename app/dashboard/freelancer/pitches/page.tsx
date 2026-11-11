import Link from 'next/link';
import { FreelancerWorkspace } from '../../../components/FreelancerWorkspace';
import { PITCHES } from '../../pitches/constants';
import type { PitchStatus } from '../../../types/dashboard.types';
import styles from '../freelancer.module.css';

// Demo ownership stays explicit until pitch submissions are backed by the signed-in user's API data.
const DEMO_FREELANCER_ID = 'priya';

const STATUS_LABEL: Record<PitchStatus, string> = {
  new: 'Submitted',
  reviewed: 'Under review',
  negotiating: 'Revision requested',
  accepted: 'Accepted',
  declined: 'Declined',
};

export default function MyPitchesPage() {
  const pitches = PITCHES.filter((pitch) => pitch.freelancer.id === DEMO_FREELANCER_ID);

  return (
    <FreelancerWorkspace>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Freelancer workspace</p>
        <h1>My pitches</h1>
        <p>Track your submitted story ideas and read the editor&apos;s feedback.</p>

        {pitches.length ? (
          <ul className={styles.pitchList}>
            {pitches.map((pitch) => (
              <li key={pitch.id} className={styles.pitchCard}>
                <div>
                  <p className={styles.eyebrow}>{pitch.category}</p>
                  <h2>{pitch.slug}</h2>
                  <p>{pitch.summary}</p>
                </div>
                <span className={styles.pitchStatus}>{STATUS_LABEL[pitch.status]}</span>
                <Link href={`/dashboard/freelancer/pitches/${pitch.id}`}>View pitch and feedback</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            You haven&apos;t submitted a pitch yet. <Link href="/dashboard/freelancer/make-a-pitch">Make a pitch</Link>.
          </p>
        )}
      </main>
    </FreelancerWorkspace>
  );
}
