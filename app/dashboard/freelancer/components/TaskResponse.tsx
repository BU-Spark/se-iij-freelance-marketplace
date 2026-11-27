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

const SUMMARY: Record<AssignmentResponse['kind'], string> = {
  interested: "You're interested",
  declined: 'You declined',
  negotiating: 'You proposed changes',
};

/** Interested / Negotiate / Decline on a task card, or what the freelancer already answered */
export function TaskResponse({ title, response, respond, withdraw }: TaskResponseProps) {
  const [dialog, setDialog] = useState<'decline' | 'negotiate' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<ResponseResult>) => {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.ok) setDialog(null);
    else setError(result.error);
  };

  return (
    <div className={styles.actions}>
      {response ? (
        <>
          <p className={styles.summary} role="status">
            {SUMMARY[response.kind]}
            {response.kind === 'negotiating' && `: ${response.proposal}`}
          </p>
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => run(withdraw)}>
            Undo
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => run(() => respond({ kind: 'interested' }))}
          >
            I&apos;m interested
          </button>
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => setDialog('negotiate')}>
            Negotiate
          </button>
          <button type="button" className={styles.secondary} disabled={busy} onClick={() => setDialog('decline')}>
            Decline
          </button>
        </>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
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
