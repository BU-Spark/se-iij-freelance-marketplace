import { useState, type FormEvent } from 'react';
import type { PitchFeedback, PitchStatus } from '../../types/dashboard.types';
import { statusForDecision } from '../../utils/pitch.utils';
import styles from './PitchActions.module.css';

type Decision = PitchFeedback['decision'];

type PitchActionsProps = {
  status: PitchStatus;
  freelancerName: string;
  savedFeedback?: PitchFeedback;
  onSubmitFeedback: (feedback: PitchFeedback) => void;
};

/** The three ways an editor can answer a pitch; this is step one of the review */
const DECISIONS: { decision: Decision; label: string; hint: string }[] = [
  { decision: 'revision_requested', label: 'Negotiate', hint: 'Ask for a revision before deciding' },
  { decision: 'accepted', label: 'Accept', hint: 'Greenlight the pitch as it stands' },
  { decision: 'rejected', label: 'Decline', hint: 'Pass on the pitch with your notes' },
];

export default function PitchActions({ status, freelancerName, savedFeedback, onSubmitFeedback }: PitchActionsProps) {
  // Step one picks the action, step two collects the notes that go with it.
  const [decision, setDecision] = useState<Decision | null>(savedFeedback?.decision ?? null);
  const [comments, setComments] = useState(savedFeedback?.comments ?? '');
  const [strengths, setStrengths] = useState(savedFeedback?.strengths ?? '');
  const [improvements, setImprovements] = useState(savedFeedback?.improvements ?? '');
  const [submitted, setSubmitted] = useState(false);

  // Choosing an action opens the notes step; changing your mind returns to step one.
  const choose = (next: Decision) => {
    setDecision(next);
    setSubmitted(false);
  };

  const changeDecision = () => {
    setDecision(null);
    setSubmitted(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decision) return;
    // The API derives the status from the decision, so this only has to send the notes
    onSubmitFeedback({
      decision,
      comments: comments.trim(),
      strengths: strengths.trim(),
      improvements: improvements.trim(),
    });
    setSubmitted(true);
  };

  return (
    <section className={styles.actions} aria-label="Review this pitch">
      <p className={styles.note}>
        {decision
          ? `Share notes with ${freelancerName} to go with your ${decisionLabel(decision).toLowerCase()} decision.`
          : `Choose how to respond to ${freelancerName}. Opening a pitch only marks it reviewed — nothing is sent until you submit.`}
      </p>
      <p className={styles.currentStatus}>
        Current status: <strong>{statusLabel(status)}</strong>
      </p>

      {decision === null ? (
        <div className={styles.choices} role="group" aria-label="Pitch decision">
          {DECISIONS.map(({ decision: value, label, hint }) => (
            <button
              key={value}
              type="button"
              className={styles.choice}
              data-decision={value}
              onClick={() => choose(value)}
            >
              <span className={styles.choiceLabel}>{label}</span>
              <span className={styles.choiceHint}>{hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <form className={styles.review} onSubmit={submit}>
          <div className={styles.chosen}>
            <span>
              Chosen action: <strong>{decisionLabel(decision)}</strong>
            </span>
            <button type="button" className={styles.change} onClick={changeDecision}>
              Change
            </button>
          </div>
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
        </form>
      )}

      {savedFeedback && (
        <section className={styles.savedFeedback} aria-label="Latest pitch feedback">
          <h3>Latest session feedback: {decisionLabel(savedFeedback.decision)}</h3>
          <p>Comments: {savedFeedback.comments}</p>
          {savedFeedback.strengths && <p>Strengths: {savedFeedback.strengths}</p>}
          {savedFeedback.improvements && <p>Improvements: {savedFeedback.improvements}</p>}
        </section>
      )}
    </section>
  );
}

function statusLabel(status: PitchStatus) {
  if (status === 'new') return 'New';
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'negotiating') return 'Negotiating';
  if (status === 'accepted') return 'Accepted';
  return 'Declined';
}

function decisionLabel(decision: Decision) {
  if (decision === 'accepted') return 'Accepted';
  if (decision === 'rejected') return 'Declined';
  return 'Negotiating';
}
