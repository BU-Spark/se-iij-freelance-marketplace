import Link from 'next/link';
import { notFound } from 'next/navigation';
import PitchDetail from '../../../../components/PitchDetail/PitchDetail';
import { PITCHES, PITCH_STATUS_LABEL } from '../../../pitches/constants';
import { DEMO_FREELANCER_ID } from '../constants';
import styles from '../myPitches.module.css';

type PitchDetailPageProps = { params: Promise<{ id: string }> };

export default async function FreelancerPitchDetailPage({ params }: PitchDetailPageProps) {
  const { id } = await params;
  const pitch = PITCHES.find((item) => item.id === id && item.freelancer.id === DEMO_FREELANCER_ID);

  if (!pitch) notFound();

  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <Link href="/dashboard/freelancer/pitches" className={styles.back}>
          ← Back to my pitches
        </Link>

        <section className={styles.panel} aria-label="Pitch details">
          <div className={styles.statusRow}>
            <span className={styles.eyebrow}>Pitch status</span>
            <span className={`${styles.pill} ${styles[pitch.status]}`}>{PITCH_STATUS_LABEL[pitch.status]}</span>
          </div>

          <PitchDetail pitch={pitch} />

          <section className={styles.feedback} aria-labelledby="pitch-feedback-heading">
            <h2 id="pitch-feedback-heading" className={styles.feedbackTitle}>
              Editor feedback
            </h2>
            <p className={styles.feedbackEmpty}>No feedback has been shared on this pitch yet.</p>
          </section>
        </section>
      </main>
    </div>
  );
}
