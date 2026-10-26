import type { PitchStatus } from '../../types/dashboard.types';
import styles from './PitchActions.module.css';

type PitchActionsProps = {
  status: PitchStatus;
  freelancerName: string;
  onChange: (status: PitchStatus) => void;
};

export default function PitchActions({ status, freelancerName, onChange }: PitchActionsProps) {
  // a short line above the buttons that explains what happens / what happened
  const note: Record<PitchStatus, string> = {
    new: `Accepting turns this pitch into an assignment for ${freelancerName}.`,
    negotiating: `You're negotiating with ${freelancerName}. Accept once you agree on terms.`,
    accepted: `This pitch is now an assignment for ${freelancerName}.`,
    declined: 'Declined. You can still accept it if you change your mind.',
  };

  return (
    <div className={styles.actions}>
      {/* aria-live: screen readers read the new message when the status changes */}
      <p className={styles.note} aria-live="polite">
        {note[status]}
      </p>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.secondary}
          disabled={status === 'declined'}
          onClick={() => onChange('declined')}
        >
          {status === 'declined' ? 'Declined' : 'Decline'}
        </button>
        <button
          type="button"
          className={styles.secondary}
          disabled={status === 'negotiating'}
          onClick={() => onChange('negotiating')}
        >
          {status === 'negotiating' ? 'Negotiating' : 'Negotiate'}
        </button>
        <button
          type="button"
          className={status === 'accepted' ? styles.done : styles.primary}
          disabled={status === 'accepted'}
          onClick={() => onChange('accepted')}
        >
          {status === 'accepted' ? 'Accepted ✓' : 'Accept pitch'}
        </button>
      </div>
    </div>
  );
}
