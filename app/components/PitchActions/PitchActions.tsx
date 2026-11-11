import { useState, type FormEvent } from 'react';
import type { PitchFeedback, PitchStatus } from '../../types/dashboard.types';
import styles from './PitchActions.module.css';

type PitchActionsProps = {
  status: PitchStatus;
  freelancerName: string;
  feedbackHistory?: PitchFeedback[];
  canSubmit?: boolean;
  onChange: (status: PitchStatus) => void;
  onSubmitFeedback: (feedback: PitchFeedback) => void;
};

export default function PitchActions({
  status,
  freelancerName,
  feedbackHistory = [],
  canSubmit = true,
  onChange,
  onSubmitFeedback,
}: PitchActionsProps) {
  const savedFeedback = feedbackHistory[0];
  const initialDecision = savedFeedback?.decision ?? decisionForStatus(status);
  const [decision, setDecision] = useState<PitchFeedback['decision']>(initialDecision);
  const [comments, setComments] = useState(savedFeedback?.comments ?? '');
  const [strengths, setStrengths] = useState(savedFeedback?.strengths ?? '');
  const [improvements, setImprovements] = useState(savedFeedback?.improvements ?? '');
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    const feedback = {
      decision,
      comments: comments.trim(),
      strengths: strengths.trim(),
      improvements: improvements.trim(),
    };
    const nextStatus = statusForDecision(decision);
    onSubmitFeedback(feedback);
    onChange(nextStatus);
    setSubmitted(true);
  };

  return (
    <form className={styles.actions} onSubmit={submit}>
      {!canSubmit ? (
        <p className={styles.note}>Feedback from the editor</p>
      ) : (
        <>
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
        </>
      )}
      {feedbackHistory.length > 0 && (
        <section className={styles.savedFeedback} aria-label="Latest pitch feedback">
          <h3>Feedback history</h3>
          <ol>
            {feedbackHistory.map((feedback, index) => (
              <li key={feedback.id ?? `${feedback.submittedAt ?? index}-${index}`}>
                <h4>{decisionLabel(feedback.decision)}</h4>
                <p>
                  <strong>{feedback.submittedBy ?? 'Desk editor'}</strong>
                  {feedback.submittedAt && (
                    <>
                      {' '}
                      ·{' '}
                      <time dateTime={new Date(feedback.submittedAt).toISOString()}>
                        {new Date(feedback.submittedAt).toLocaleString()}
                      </time>
                    </>
                  )}
                </p>
                <p>Comments: {feedback.comments}</p>
                {feedback.strengths && <p>Strengths: {feedback.strengths}</p>}
                {feedback.improvements && <p>Improvements: {feedback.improvements}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
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

function statusForDecision(decision: PitchFeedback['decision']): PitchStatus {
  if (decision === 'accepted') return 'accepted';
  if (decision === 'rejected') return 'declined';
  return 'reviewed';
}
