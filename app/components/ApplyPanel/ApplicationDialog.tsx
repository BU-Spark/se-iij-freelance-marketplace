'use client';

import { useId, useState, type FormEvent } from 'react';
import type { Assignment } from '../../types/assignments.types';
import { formatCompensation } from '../../utils/assignment.utils';
import Modal from '../Modal/Modal';
import {
  MAX_NOTE,
  MAX_SAMPLES,
  validateApplication,
  type ApplicationDraft,
  type ApplicationErrors,
} from './application.utils';
import styles from './ApplyPanel.module.css';

type ApplicationDialogProps = {
  assignment: Assignment;
  draft: ApplicationDraft;
  /** true when changing an application that was already sent */
  editing: boolean;
  onChange: (draft: ApplicationDraft) => void;
  onSend: () => void;
  onClose: () => void;
};

export const formatDue = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** The application form: a note, work samples, pay and deadline */
export default function ApplicationDialog({
  assignment,
  draft,
  editing,
  onChange,
  onSend,
  onClose,
}: ApplicationDialogProps) {
  const [attempted, setAttempted] = useState(false);
  const id = useId();
  const formId = `${id}-form`;
  const pay = formatCompensation(assignment.compensation);
  const needs = { deadline: Boolean(assignment.deadline) };
  // errors appear after the first send attempt, then clear as each field is fixed
  const errors: ApplicationErrors = attempted ? validateApplication(draft, needs) : {};

  const set = (patch: Partial<ApplicationDraft>) => onChange({ ...draft, ...patch });
  const setSample = (index: number, value: string) =>
    set({ samples: draft.samples.map((sample, i) => (i === index ? value : sample)) });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(validateApplication(draft, needs)).length === 0) {
      onSend();
      return;
    }
    setAttempted(true);
    // take the person to the first thing that needs fixing, once it is marked
    const form = event.currentTarget;
    requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  };

  const problem = (message: string | undefined, errorId: string) =>
    message && (
      <p id={errorId} className={styles.error}>
        {message}
      </p>
    );
  const invalid = (message: string | undefined, errorId: string) =>
    message ? { 'aria-invalid': true, 'aria-describedby': errorId } : {};

  return (
    <Modal
      title={editing ? 'Your application' : 'Apply for this assignment'}
      subtitle={assignment.title}
      onClose={onClose}
      footer={
        <div className={styles.dialogFoot}>
          <p className={styles.previewNote}>Preview only: nothing is sent to editors yet.</p>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Close
          </button>
          <button type="submit" form={formId} className={styles.primary}>
            {editing ? 'Save changes' : 'Send application'}
          </button>
        </div>
      }
    >
      <form id={formId} className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${id}-note`} className={styles.label}>
            Why are you a good fit?
          </label>
          <textarea
            id={`${id}-note`}
            className={styles.input}
            rows={4}
            maxLength={MAX_NOTE}
            value={draft.note}
            placeholder="Relevant experience, sources you already have, how you would approach it…"
            onChange={(e) => set({ note: e.target.value })}
            {...invalid(errors.note, `${id}-note-error`)}
          />
          <span className={styles.count}>
            {draft.note.length}/{MAX_NOTE}
          </span>
          {problem(errors.note, `${id}-note-error`)}
        </div>

        <fieldset className={styles.field}>
          <legend className={styles.label}>Work samples</legend>
          <p className={styles.hint}>Up to {MAX_SAMPLES} links to work the editor can open.</p>
          {draft.samples.map((sample, index) => (
            <div key={index} className={styles.field}>
              <div className={styles.sample}>
                <input
                  type="url"
                  inputMode="url"
                  className={styles.input}
                  aria-label={`Work sample ${index + 1}`}
                  value={sample}
                  placeholder="https://"
                  onChange={(e) => setSample(index, e.target.value)}
                  {...invalid(errors.samples?.[index], `${id}-sample-${index}-error`)}
                />
                {draft.samples.length > 1 && (
                  <button
                    type="button"
                    className={styles.link}
                    aria-label={`Remove work sample ${index + 1}`}
                    onClick={() => set({ samples: draft.samples.filter((_, i) => i !== index) })}
                  >
                    Remove
                  </button>
                )}
              </div>
              {problem(errors.samples?.[index], `${id}-sample-${index}-error`)}
            </div>
          ))}
          {draft.samples.length < MAX_SAMPLES && (
            <button type="button" className={styles.link} onClick={() => set({ samples: [...draft.samples, ''] })}>
              + Add another link
            </button>
          )}
        </fieldset>

        <fieldset className={styles.field}>
          <legend className={styles.label}>Pay</legend>
          {pay ? (
            <>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name={`${id}-rate`}
                  checked={draft.rateChoice === 'listed'}
                  onChange={() => set({ rateChoice: 'listed' })}
                />
                Accept the listed pay ({pay})
              </label>
              <label className={styles.choice}>
                <input
                  type="radio"
                  name={`${id}-rate`}
                  checked={draft.rateChoice === 'other'}
                  onChange={() => set({ rateChoice: 'other' })}
                />
                Propose a different rate
              </label>
            </>
          ) : (
            <p className={styles.hint}>No pay is listed. Add your rate if you have one (optional).</p>
          )}
          {(!pay || draft.rateChoice === 'other') && (
            <input
              type="text"
              className={styles.input}
              aria-label="Your rate"
              value={draft.rate}
              placeholder="e.g. $900 flat or $1.20/word"
              onChange={(e) => set({ rate: e.target.value })}
              {...invalid(errors.rate, `${id}-rate-error`)}
            />
          )}
          {problem(errors.rate, `${id}-rate-error`)}
        </fieldset>

        {assignment.deadline && (
          <div className={styles.field}>
            <label className={styles.choice}>
              <input
                type="checkbox"
                checked={draft.meetsDeadline}
                onChange={(e) => set({ meetsDeadline: e.target.checked })}
                {...invalid(errors.meetsDeadline, `${id}-deadline-error`)}
              />
              I can deliver by {formatDue(assignment.deadline)}
            </label>
            {problem(errors.meetsDeadline, `${id}-deadline-error`)}
          </div>
        )}
      </form>
    </Modal>
  );
}
