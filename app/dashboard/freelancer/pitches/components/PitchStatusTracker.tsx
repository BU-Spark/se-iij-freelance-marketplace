import type { PitchStatus } from '../../../../types/dashboard.types';
import styles from './PitchStatusTracker.module.css';

export type StepState = 'done' | 'current' | 'upcoming';

export type PitchStep = { label: string; state: StepState; tone?: 'accepted' | 'declined' };

/** What the freelancer can expect next, for each place a pitch can be in the editor's review */
export const NEXT_STEP: Record<PitchStatus, string> = {
  new: 'Waiting for the editor to open your pitch.',
  reviewed: 'The editor has read your pitch and is deciding.',
  negotiating: 'The editor wants changes. Check their feedback below.',
  accepted: 'Greenlit. The editor will follow up with the assignment details.',
  declined: 'Not this time. Read the feedback below before you pitch again.',
};

/**
 * The three stages a pitch passes through: sent, read by the editor, decided.
 * Negotiating is still the review stage, so a pitch can sit there more than once without going back.
 */
export function pitchProgress(status: PitchStatus): PitchStep[] {
  const decided = status === 'accepted' || status === 'declined';
  const inReview = status === 'reviewed' || status === 'negotiating';

  return [
    { label: 'Submitted', state: status === 'new' ? 'current' : 'done' },
    {
      label: status === 'negotiating' ? 'Negotiating' : 'In review',
      state: decided ? 'done' : inReview ? 'current' : 'upcoming',
    },
    decided
      ? { label: status === 'accepted' ? 'Accepted' : 'Declined', state: 'current', tone: status }
      : { label: 'Decision', state: 'upcoming' },
  ];
}

/** A small progress line on the freelancer's pitch page, so the status reads as a journey, not a label */
export default function PitchStatusTracker({ status }: { status: PitchStatus }) {
  return (
    <div className={styles.tracker}>
      <ol className={styles.steps} aria-label="Pitch progress">
        {pitchProgress(status).map((step) => (
          <li
            key={step.label}
            className={[styles.step, styles[step.state], step.tone && styles[step.tone]].filter(Boolean).join(' ')}
            aria-current={step.state === 'current' ? 'step' : undefined}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{step.label}</span>
          </li>
        ))}
      </ol>
      <p className={styles.next}>{NEXT_STEP[status]}</p>
    </div>
  );
}
