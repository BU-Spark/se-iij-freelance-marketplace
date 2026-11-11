'use client';

import { useState, type FormEvent } from 'react';
import type { AssignmentFeedback } from '../../../types/assignments.types';
import styles from './assignmentFeedback.module.css';

type RatingField = 'quality' | 'communication' | 'timeliness';
type AssignmentFeedbackFormProps = {
  feedbackHistory?: AssignmentFeedback[];
  /** Compatibility for callers that only have a single prior entry. */
  savedFeedback?: AssignmentFeedback;
  canSubmit?: boolean;
  onSubmit: (feedback: AssignmentFeedback) => void;
};

const RATINGS: { field: RatingField; label: string }[] = [
  { field: 'quality', label: 'Quality' },
  { field: 'communication', label: 'Communication' },
  { field: 'timeliness', label: 'Timeliness' },
];

export default function AssignmentFeedbackForm({
  feedbackHistory = [],
  savedFeedback,
  canSubmit = true,
  onSubmit,
}: AssignmentFeedbackFormProps) {
  const [quality, setQuality] = useState<AssignmentFeedback['quality'] | null>(null);
  const [communication, setCommunication] = useState<AssignmentFeedback['communication'] | null>(null);
  const [timeliness, setTimeliness] = useState<AssignmentFeedback['timeliness'] | null>(null);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const setRating = (field: RatingField, value: number) => {
    const rating = value as AssignmentFeedback['quality'];
    if (field === 'quality') setQuality(rating);
    if (field === 'communication') setCommunication(rating);
    if (field === 'timeliness') setTimeliness(rating);
    setSubmitted(false);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!quality || !communication || !timeliness) return;

    onSubmit({ quality, communication, timeliness, comments: comments.trim() });
    setSubmitted(true);
  };

  return (
    <section className={styles.panel} aria-labelledby="assignment-feedback-title">
      <h2 id="assignment-feedback-title">Freelancer feedback</h2>
      {canSubmit && <p className={styles.intro}>Rate the completed work and leave feedback for the freelancer.</p>}

      {canSubmit && (
        <form className={styles.form} onSubmit={submit}>
          {RATINGS.map(({ field, label }) => (
            <fieldset className={styles.rating} key={field}>
              <legend>{label}</legend>
              <div className={styles.options}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name={field}
                      value={value}
                      checked={
                        (field === 'quality' ? quality : field === 'communication' ? communication : timeliness) ===
                        value
                      }
                      onChange={() => setRating(field, value)}
                      required
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
              <span className={styles.scale}>1 = Needs improvement · 5 = Excellent</span>
            </fieldset>
          ))}

          <label className={styles.comments}>
            <span>Comments</span>
            <textarea
              value={comments}
              onChange={(event) => {
                setComments(event.target.value);
                setSubmitted(false);
              }}
              rows={4}
              required
            />
          </label>

          <div className={styles.footer}>
            <button type="submit">Submit feedback</button>
            {submitted && <p role="status">Feedback saved for this session.</p>}
          </div>
        </form>
      )}

      {(feedbackHistory.length > 0 || savedFeedback) && (
        <section className={styles.saved} aria-label="Latest assignment feedback">
          <h3>Feedback history</h3>
          <ol>
            {(feedbackHistory.length ? feedbackHistory : [savedFeedback!]).map((feedback, index) => (
              <li key={feedback.id ?? `${feedback.submittedAt ?? index}-${index}`}>
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
                <p>
                  Quality: {feedback.quality}/5 · Communication: {feedback.communication}/5 · Timeliness:{' '}
                  {feedback.timeliness}/5
                </p>
                <p>Comments: {feedback.comments}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
