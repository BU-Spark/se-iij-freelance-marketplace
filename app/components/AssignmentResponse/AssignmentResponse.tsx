'use client';

import { useState } from 'react';
import { AssignmentInterestButton } from '../AssignmentInterestButton';
import { DeclineDialog, NegotiateDialog } from '../ResponseDialogs/ResponseDialogs';
import { useAssignmentResponses } from '../../hooks/useAssignmentResponses';
import styles from './AssignmentResponse.module.css';

type AssignmentResponseProps = { assignmentId: string; assignmentTitle: string };

/** The freelancer's answer to one assignment: interested, decline with reasons, or propose changes */
export default function AssignmentResponse({ assignmentId, assignmentTitle }: AssignmentResponseProps) {
  const { responses, respond, withdraw } = useAssignmentResponses();
  const [dialog, setDialog] = useState<'decline' | 'negotiate' | null>(null);
  const response = responses[assignmentId];
  const now = () => new Date().toISOString();

  return (
    <section className={styles.box} aria-label="Your response">
      {response?.kind === 'declined' ? (
        <>
          <p className={styles.status}>You passed on this assignment.</p>
          <p className={styles.detail}>
            <strong>Why you passed:</strong> {response.reasons.join(', ')}
            {response.note && ` — ${response.note}`}
          </p>
          <button type="button" className={styles.link} onClick={() => withdraw(assignmentId)}>
            Reconsider
          </button>
        </>
      ) : response?.kind === 'negotiating' ? (
        <>
          <p className={styles.status}>Your proposed changes are with the editor.</p>
          <p className={styles.detail}>{response.proposal}</p>
          <button type="button" className={styles.link} onClick={() => withdraw(assignmentId)}>
            Withdraw proposal
          </button>
        </>
      ) : (
        <>
          <p className={styles.status}>
            {response?.kind === 'interested'
              ? "You've signaled interest. The editor will follow up."
              : 'Signal interest to be considered.'}
          </p>
          <div className={styles.actions}>
            <AssignmentInterestButton
              assignmentTitle={assignmentTitle}
              state={{ status: response?.kind === 'interested' ? 'interested' : 'idle' }}
              onExpressInterest={() => respond(assignmentId, { kind: 'interested', at: now() })}
            />
            {response?.kind === 'interested' ? (
              <button type="button" className={styles.link} onClick={() => withdraw(assignmentId)}>
                Withdraw interest
              </button>
            ) : (
              <>
                <button type="button" className={styles.secondary} onClick={() => setDialog('negotiate')}>
                  Negotiate
                </button>
                <button type="button" className={styles.secondary} onClick={() => setDialog('decline')}>
                  Decline
                </button>
              </>
            )}
          </div>
        </>
      )}

      <p className={styles.note}>Saved on this device only for now. Editors will see responses in a later update.</p>

      {dialog === 'decline' && (
        <DeclineDialog
          assignmentTitle={assignmentTitle}
          onClose={() => setDialog(null)}
          onSend={(reasons, note) => {
            respond(assignmentId, { kind: 'declined', reasons, note, at: now() });
            setDialog(null);
          }}
        />
      )}
      {dialog === 'negotiate' && (
        <NegotiateDialog
          assignmentTitle={assignmentTitle}
          onClose={() => setDialog(null)}
          onSend={(proposal) => {
            respond(assignmentId, { kind: 'negotiating', proposal, at: now() });
            setDialog(null);
          }}
        />
      )}
    </section>
  );
}
