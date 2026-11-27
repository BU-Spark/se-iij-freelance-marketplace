'use client';

import { useState } from 'react';
import { AssignmentInterestButton } from '../../../components/AssignmentInterestButton';
import type { ResponseResult } from '../../../hooks/useAssignmentResponses';
import type { AssignmentResponse } from '../../../types/assignments.types';
import styles from './ApplyControl.module.css';

export type ApplyControlProps = {
  /** identifies the assignment in the button's accessible name */
  title: string;
  /** the saved answer, when this freelancer already applied */
  response?: AssignmentResponse;
  apply: () => Promise<ResponseResult>;
  withdraw: () => Promise<ResponseResult>;
  className?: string;
};

/**
 * The freelancer's application to one assignment: "I'm interested" until the server confirms,
 * then a way to take the application back. The parent owns the saved answers.
 */
export function ApplyControl({ title, response, apply, withdraw, className }: ApplyControlProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const root = [styles.control, className].filter(Boolean).join(' ');

  const run = async (action: () => Promise<ResponseResult>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  if (response?.kind === 'interested') {
    return (
      <div className={root}>
        <p className={styles.status}>You&apos;ve applied. The editor can see your interest.</p>
        <button type="button" className={styles.withdraw} disabled={busy} onClick={() => run(withdraw)}>
          {busy ? 'Withdrawing…' : 'Withdraw application'}
        </button>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <AssignmentInterestButton
      className={root}
      assignmentTitle={title}
      state={busy ? { status: 'submitting' } : error ? { status: 'error', message: error } : { status: 'idle' }}
      onExpressInterest={() => run(apply)}
    />
  );
}
