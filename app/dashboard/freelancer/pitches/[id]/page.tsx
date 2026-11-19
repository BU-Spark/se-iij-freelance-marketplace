import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import PitchDetail from '../../../../components/PitchDetail/PitchDetail';
import PitchFeedbackCard from '../components/PitchFeedbackCard';
import { canViewPitch, getPitch, loadPitchViewer, toPitch } from '../../../../../lib/pitches';
import { requireWorkspace } from '../../../../../lib/workspace';
import { PITCH_STATUS_LABEL } from '../../../pitches/constants';
import styles from '../myPitches.module.css';

type PitchDetailPageProps = { params: Promise<{ id: string }> };

export default async function FreelancerPitchDetailPage({ params }: PitchDetailPageProps) {
  await requireWorkspace('freelancer');

  const { id } = await params;
  const { userId } = await auth();
  const viewer = userId ? await loadPitchViewer(userId) : null;
  const pitch = await getPitch(id);

  // 404 for someone else's pitch, so ids don't leak between workspaces
  if (!pitch || !canViewPitch(viewer, pitch)) notFound();

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

          <PitchDetail pitch={toPitch(pitch)} />

          <section className={styles.feedback} aria-labelledby="pitch-feedback-heading">
            <h2 id="pitch-feedback-heading" className={styles.feedbackTitle}>
              Editor feedback
            </h2>
            <PitchFeedbackCard feedback={pitch.feedback} feedbackAt={pitch.feedback_at} />
          </section>
        </section>
      </main>
    </div>
  );
}
