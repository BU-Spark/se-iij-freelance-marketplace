import type { ReactNode } from 'react';
import type { PitchDraft, PitchFormErrors } from '../../types/pitchForm.types';
import { TOPICS } from '../../onboarding/constants';
import ChipGroup from '../ChipGroup/ChipGroup';
import { CompensationFields } from './CompensationFields';
import styles from './PitchForm.module.css';

export type PitchFormProps = {
  draft: PitchDraft;
  errors: PitchFormErrors;
  onChange: (patch: Partial<PitchDraft>) => void;
  onSend: () => void;
  /** true while the pitch is on its way, so the button cannot be pressed twice */
  sending?: boolean;
  /** shown in the footer beside the send button, e.g. the send result */
  notice?: ReactNode;
};
export function PitchForm({ draft, errors, onChange, onSend, sending = false, notice }: PitchFormProps) {
  const field = (
    key: Exclude<keyof PitchDraft, 'compensation' | 'category'>,
    label: string,
    multiline = false,
    type = 'text',
    placeholder?: string
  ) => (
    <label>
      <span className={styles.label}>{label}</span>
      {multiline ? (
        <textarea
          aria-label={label}
          rows={key === 'description' ? 6 : 3}
          value={draft[key]}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          onChange={(event) => onChange({ [key]: event.target.value })}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={draft[key]}
          placeholder={placeholder}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          onChange={(event) => onChange({ [key]: event.target.value })}
        />
      )}
      {errors[key] && (
        <span id={`${key}-error`} className={styles.error}>
          {errors[key]}
        </span>
      )}
    </label>
  );
  return (
    <form
      noValidate
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      {/* one category, picked with chips like "Project type" on New Assignment */}
      <fieldset className={styles.fieldset} aria-describedby={errors.category ? 'category-error' : undefined}>
        <legend className={styles.label}>Category</legend>
        <ChipGroup
          options={TOPICS}
          selected={draft.category ? [draft.category] : []}
          onToggle={(topic) => onChange({ category: topic })}
        />
        {errors.category && (
          <p id="category-error" className={styles.error}>
            {errors.category}
          </p>
        )}
      </fieldset>
      {field('title', 'Pitch title', false, 'text', 'e.g. Inside the city budget shortfall')}
      {field('editorEmail', 'Recipient editor email', false, 'email', 'editor@outlet.com')}
      {field('summary', 'Summary', true, 'text', 'The story in two or three sentences…')}
      {field('description', 'Story angle and reporting plan', true, 'text', 'Angle, sources, access, timeline…')}
      <div className={styles.row}>
        {field('location', 'Location', false, 'text', 'Remote / address')}
        {field('length', 'Proposed length or duration', false, 'text', 'Words or hours')}
      </div>
      {field('deadline', 'Proposed delivery date', false, 'date')}
      <CompensationFields
        value={draft.compensation}
        onChange={(compensation) => onChange({ compensation })}
        error={errors.compensation}
      />
      <div>
        {field('inviteEmails', 'Collaborator emails (optional)', true, 'text', 'name@example.com, other@example.com')}
        <p className={styles.hint}>Separate emails with commas.</p>
      </div>
      <div className={styles.actions}>
        {notice && <div className={styles.notice}>{notice}</div>}
        <button type="submit" disabled={sending}>
          Send pitch
        </button>
      </div>
    </form>
  );
}
