'use client';

import { useId } from 'react';
import styles from './AssignmentInterestButton.module.css';

/** The parent owns request state; the button never assumes a submission succeeded. */
export type AssignmentInterestState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'interested' }
  | { status: 'error'; message: string };

export type AssignmentInterestButtonProps = {
  assignmentTitle: string;
  state: AssignmentInterestState;
  onExpressInterest: () => void;
  /** Additional restrictions, such as a closed assignment or missing freelancer role. */
  disabled?: boolean;
  className?: string;
};

export function AssignmentInterestButton({
  assignmentTitle,
  state,
  onExpressInterest,
  disabled = false,
  className,
}: AssignmentInterestButtonProps) {
  const messageId = useId();
  const submitting = state.status === 'submitting';
  const interested = state.status === 'interested';
  const blocked = disabled || submitting || interested;
  const labels: Record<AssignmentInterestState['status'], string> = {
    idle: "I'm interested",
    submitting: 'Sending interest…',
    interested: 'Interest expressed',
    error: 'Retry expressing interest',
  };
  const label = labels[state.status];
  const message =
    state.status === 'error'
      ? state.message.trim() || 'Unable to express interest. Please try again.'
      : submitting
        ? 'Sending your interest. Please wait.'
        : interested
          ? 'Your interest has been recorded.'
          : '';

  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      <button
        type="button"
        className={`${styles.button} ${interested ? styles.interested : ''}`}
        disabled={blocked}
        aria-busy={submitting}
        aria-label={`${label}: ${assignmentTitle}`}
        aria-describedby={message ? messageId : undefined}
        onClick={() => {
          if (!blocked) onExpressInterest();
        }}
      >
        {label}
      </button>
      <p
        id={messageId}
        role={state.status === 'error' ? 'alert' : 'status'}
        className={state.status === 'error' ? styles.error : styles.message}
      >
        {message}
      </p>
    </div>
  );
}
