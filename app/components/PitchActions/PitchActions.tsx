import { useState, type FormEvent } from 'react';
import type { PitchFeedback, PitchStatus } from '../../types/dashboard.types';
import { statusForDecision } from '../../utils/pitch.utils';
import styles from './PitchActions.module.css';

type PitchActionsProps = {
  status: PitchStatus;
  freelancerName: string;
  savedFeedback?: PitchFeedback;
  onSubmitFeedback: (feedback: PitchFeedback) => void;
};

export default function PitchActions({ status, freelancerName, savedFeedback, onSubmitFeedback }: PitchActionsProps) {
  const initialDecision = savedFeedback?.decision ?? decisionForStatus(status);
  const [decision, setDecision] = useState<PitchFeedback['decision']>(initialDecision);
  const [comments, setComments] = useState(savedFeedback?.comments ?? '');
  const [strengths, setStrengths] = useState(savedFeedback?.strengths ?? '');
  const [improvements, setImprovements] = useState(savedFeedback?.improvements ?? '');
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const feedback = {
      decision,
      comments: comments.trim(),
      strengths: strengths.trim(),
      improvements: improvements.trim(),
    };
    // The API derives the status from the decision, so this only has to send the notes
    onSubmitFeedback(feedback);
    setSubmitted(true);
  };

  return (
    <form className={styles.actions} onSubmit={submit}>
      <p className={styles.note}>Share a decision and clear feedback with {freelancerName}.</p>
      <label className={styles.field}>
        <span>Decision</span>
        <select
          value={decision}
          onChange={(event) => {
            setDecision(event.target.value as PitchFeedback['decision']);
            setSubmitted(false);
          }}
        >
          <option value="accepted">Accept pitch</option>
          <option value="rejected">Reject pitch</option>
          <option value="revision_requested">Request revision</option>
        </select>
      </label>
      <label className={styles.field}>
        <span>Comments</span>
        <textarea
          value={comments}
          onChange={(event) => {
            setComments(event.target.value);
            setSubmitted(false);
          }}
          rows={3}
          required
        />
      </label>
      <label className={styles.field}>
        <span>Strengths</span>
        <textarea
          value={strengths}
          onChange={(event) => {
            setStrengths(event.target.value);
            setSubmitted(false);
          }}
          rows={2}
        />
      </label>
      <label className={styles.field}>
        <span>Improvements</span>
        <textarea
          value={improvements}
          onChange={(event) => {
            setImprovements(event.target.value);
            setSubmitted(false);
          }}
          rows={2}
        />
      </label>
      {savedFeedback && (
        <section className={styles.savedFeedback} aria-label="Latest pitch feedback">
          <h3>Latest session feedback: {decisionLabel(savedFeedback.decision)}</h3>
          <p>Comments: {savedFeedback.comments}</p>
          {savedFeedback.strengths && <p>Strengths: {savedFeedback.strengths}</p>}
          {savedFeedback.improvements && <p>Improvements: {savedFeedback.improvements}</p>}
        </section>
      )}
      <div className={styles.buttons}>
        <button type="submit" className={styles.primary}>
          Submit feedback
        </button>
        {submitted && (
          <span role="status">
            Feedback added for this session. Current pitch status: {statusLabel(statusForDecision(decision))}.
          </span>
        )}
      </div>
    </form>
  );
}

function statusLabel(status: PitchStatus) {
  if (status === 'accepted') return 'Accepted';
  if (status === 'declined') return 'Rejected';
  if (status === 'negotiating') return 'Revision requested';
  return status === 'new' ? 'Submitted' : 'Under review';
}

function decisionLabel(decision: PitchFeedback['decision']) {
  if (decision === 'accepted') return 'Accepted';
  if (decision === 'rejected') return 'Rejected';
  return 'Revision requested';
}

function decisionForStatus(status: PitchStatus): PitchFeedback['decision'] {
  if (status === 'accepted') return 'accepted';
  if (status === 'declined') return 'rejected';
  return 'revision_requested';
}
