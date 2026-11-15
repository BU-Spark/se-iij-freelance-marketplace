'use client';

import { useId, useState } from 'react';
import Modal from '../Modal/Modal';
import styles from './ResponseDialogs.module.css';

export const DECLINE_REASONS = [
  "Timing doesn't work",
  "Budget doesn't fit",
  'Outside my beat',
  'Needs more detail',
  'Different expertise needed',
] as const;

type DeclineDialogProps = {
  assignmentTitle: string;
  onSend: (reasons: string[], note: string) => void;
  onClose: () => void;
};

/** "Why did you pass?": at least one reason, plus optional feedback for the editor */
export function DeclineDialog({ assignmentTitle, onSend, onClose }: DeclineDialogProps) {
  const [reasons, setReasons] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [showError, setShowError] = useState(false);
  const noteId = useId();

  const toggle = (reason: string) =>
    setReasons((current) => (current.includes(reason) ? current.filter((r) => r !== reason) : [...current, reason]));

  const send = () => {
    if (reasons.length === 0) {
      setShowError(true);
      return;
    }
    onSend(reasons, note.trim());
  };

  return (
    <Modal
      title="Why did you pass?"
      subtitle={assignmentTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.primary} onClick={send}>
            Send decline
          </button>
        </>
      }
    >
      <fieldset className={styles.reasons}>
        <legend className={styles.label}>Reasons</legend>
        {DECLINE_REASONS.map((reason) => (
          <label key={reason} className={styles.reason}>
            <input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggle(reason)} />
            {reason}
          </label>
        ))}
      </fieldset>
      {showError && reasons.length === 0 && (
        <p role="alert" className={styles.error}>
          Select at least one reason for declining this assignment.
        </p>
      )}
      <label htmlFor={noteId} className={styles.label}>
        Specific feedback (optional)
      </label>
      <textarea
        id={noteId}
        className={styles.textarea}
        rows={3}
        value={note}
        placeholder="Anything that would help the editor next time…"
        onChange={(e) => setNote(e.target.value)}
      />
    </Modal>
  );
}

type NegotiateDialogProps = {
  assignmentTitle: string;
  onSend: (proposal: string) => void;
  onClose: () => void;
};

/** "Propose changes": the terms the freelancer would take the work on */
export function NegotiateDialog({ assignmentTitle, onSend, onClose }: NegotiateDialogProps) {
  const [proposal, setProposal] = useState('');
  const [showError, setShowError] = useState(false);
  const proposalId = useId();

  const send = () => {
    if (!proposal.trim()) {
      setShowError(true);
      return;
    }
    onSend(proposal.trim());
  };

  return (
    <Modal
      title="Propose changes"
      subtitle={assignmentTitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.primary} onClick={send}>
            Send proposal
          </button>
        </>
      }
    >
      <label htmlFor={proposalId} className={styles.label}>
        Proposed changes
      </label>
      <textarea
        id={proposalId}
        className={styles.textarea}
        rows={4}
        value={proposal}
        placeholder="e.g. $1.30/word instead of $1.10, deadline pushed one week, add a photo budget."
        onChange={(e) => setProposal(e.target.value)}
      />
      {showError && !proposal.trim() && (
        <p role="alert" className={styles.error}>
          Describe the specific changes you&apos;d like on this assignment.
        </p>
      )}
    </Modal>
  );
}
