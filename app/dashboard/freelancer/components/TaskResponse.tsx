'use client';
import { useState } from 'react';
import type { AssignmentResponse, AssignmentResponseInput } from '../../../types/assignments.types';
import type { ResponseResult } from '../../../hooks/useAssignmentResponses';
import { DeclineDialog, NegotiateDialog } from '../../../components/ResponseDialogs/ResponseDialogs';
import styles from './TaskResponse.module.css';

export type TaskResponseProps = {
  title: string;
  response?: AssignmentResponse;
  respond: (input: AssignmentResponseInput) => Promise<ResponseResult>;
  withdraw: () => Promise<ResponseResult>;
};

const MESSAGE: Record<AssignmentResponse['kind'] | 'none', string> = {
  none: 'Signal interest to be considered.',
  interested: "You've signaled interest. The editor will follow up.",
  negotiating: 'Your proposed changes are with the editor.',
  declined: 'You passed on this assignment.',
};

/**
 * Decline / Negotiate / I'm interested on a task card. The buttons stay visible after answering:
 * their labels show the current answer, Decline and Negotiate reopen their dialog to change it,
 * and clicking "Interested ✓" again takes the interest back.
 */
export function TaskResponse({ title, response, respond, withdraw }: TaskResponseProps) {
  const [dialog, setDialog] = useState<'decline' | 'negotiate' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = response?.kind;

  const run = async (action: () => Promise<ResponseResult>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) setDialog(null);
    else setError(result.error);
  };

  return (
    <div className={styles.response}>
      <div className={styles.row}>
        <p className={styles.message}>{MESSAGE[kind ?? 'none']}</p>
        <div className={styles.buttons}>
          <button
            type="button"
            className={kind === 'declined' ? styles.selected : styles.secondary}
            disabled={busy}
            onClick={() => setDialog('decline')}
          >
            {kind === 'declined' ? 'Declined' : 'Decline'}
          </button>
          <button
            type="button"
            className={kind === 'negotiating' ? styles.selected : styles.secondary}
            disabled={busy}
            onClick={() => setDialog('negotiate')}
          >
            {kind === 'negotiating' ? 'Negotiating…' : 'Negotiate'}
          </button>
          <button
            type="button"
            className={kind === 'interested' ? styles.selected : styles.primary}
            disabled={busy}
            aria-pressed={kind === 'interested'}
            onClick={() => run(kind === 'interested' ? withdraw : () => respond({ kind: 'interested' }))}
          >
            {kind === 'interested' ? 'Interested ✓' : "I'm interested"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {response?.kind === 'declined' && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Why you passed</p>
          <ul className={styles.chips}>
            {response.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {response.note && <p className={styles.panelText}>{response.note}</p>}
        </div>
      )}
      {response?.kind === 'negotiating' && (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Proposed changes sent</p>
          <p className={styles.panelText}>{response.proposal}</p>
        </div>
      )}
      {dialog === 'decline' && (
        <DeclineDialog
          assignmentTitle={title}
          onClose={() => setDialog(null)}
          onSend={(reasons, note) => run(() => respond({ kind: 'declined', reasons, note }))}
        />
      )}
      {dialog === 'negotiate' && (
        <NegotiateDialog
          assignmentTitle={title}
          onClose={() => setDialog(null)}
          onSend={(proposal) => run(() => respond({ kind: 'negotiating', proposal }))}
        />
      )}
    </div>
  );
}
