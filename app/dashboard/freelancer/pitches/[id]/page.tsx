import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FreelancerWorkspace } from '../../../../components/FreelancerWorkspace';
import PitchDetail from '../../../../components/PitchDetail/PitchDetail';
import type { PitchStatus } from '../../../../types/dashboard.types';
import { PITCHES } from '../../../pitches/constants';
import styles from '../../freelancer.module.css';

const DEMO_FREELANCER_ID = 'priya';

const STATUS_LABEL: Record<PitchStatus, string> = {
  new: 'Submitted',
  reviewed: 'Under review',
  negotiating: 'Revision requested',
  accepted: 'Accepted',
  declined: 'Declined',
};

type PitchDetailPageProps = { params: Promise<{ id: string }> };

export default async function FreelancerPitchDetailPage({ params }: PitchDetailPageProps) {
  const { id } = await params;
  const pitch = PITCHES.find((item) => item.id === id && item.freelancer.id === DEMO_FREELANCER_ID);

  if (!pitch) notFound();

  return (
    <FreelancerWorkspace>
      <main className={styles.main}>
        <Link href="/dashboard/freelancer/pitches">← Back to my pitches</Link>
        <div className={styles.pitchDetailHeader}>
          <p className={styles.eyebrow}>Pitch status</p>
          <span className={styles.pitchStatus}>{STATUS_LABEL[pitch.status]}</span>
        </div>

        <PitchDetail pitch={pitch} />

        <section className={styles.pitchFeedback} aria-labelledby="pitch-feedback-heading">
          <h2 id="pitch-feedback-heading">Editor feedback</h2>
          <p>No feedback has been shared on this pitch yet.</p>
        </section>
      </main>
    </FreelancerWorkspace>
  );
}
