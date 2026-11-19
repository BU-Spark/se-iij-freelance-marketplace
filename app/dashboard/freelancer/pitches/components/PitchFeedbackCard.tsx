import Link from 'next/link';
import type { PitchFeedback } from '../../../../types/dashboard.types';
import styles from './PitchFeedbackCard.module.css';

export const DECISION_LABEL: Record<PitchFeedback['decision'], string> = {
  accepted: 'Accepted',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
};

type PitchFeedbackCardProps = {
  feedback: PitchFeedback | null;
  /** When the editor shared the decision */
  feedbackAt?: Date | null;
};

/** The editor's decision and notes, split into the parts the review form collects */
export default function PitchFeedbackCard({ feedback, feedbackAt }: PitchFeedbackCardProps) {
  if (!feedback) {
    return <p className={styles.empty}>No feedback has been shared on this pitch yet.</p>;
  }

  // Only the parts the editor actually filled in; an empty heading reads like missing data
  const sections = [
    { title: "Editor's comments", body: feedback.comments },
    { title: 'What worked', body: feedback.strengths },
    { title: 'What to improve', body: feedback.improvements },
  ].filter((section) => section.body?.trim());

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <span className={`${styles.decision} ${styles[feedback.decision]}`}>{DECISION_LABEL[feedback.decision]}</span>
        {feedbackAt && (
          <span className={styles.date}>
            Shared{' '}
            {new Date(feedbackAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {sections.length ? (
        <dl className={styles.sections}>
          {sections.map((section) => (
            <div key={section.title}>
              <dt>{section.title}</dt>
              <dd>{section.body}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className={styles.date}>The editor did not add any notes.</p>
      )}

      {feedback.decision === 'revision_requested' && (
        <Link href="/dashboard/freelancer/make-a-pitch" className={styles.action}>
          Revise and pitch again →
        </Link>
      )}
    </div>
  );
}
