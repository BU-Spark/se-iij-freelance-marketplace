import type { PitchDraft, PitchFormErrors } from '../../types/pitchForm.types';
import { TOPICS } from '../../onboarding/constants';
import { CompensationFields } from './CompensationFields';
import { pitchSlug } from './pitchForm.utils';
import styles from './PitchForm.module.css';

export type PitchFormProps = {
  draft: PitchDraft;
  errors: PitchFormErrors;
  onChange: (patch: Partial<PitchDraft>) => void;
  onReview: () => void;
  onSaveDraft: () => void;
};
export function PitchForm({ draft, errors, onChange, onReview, onSaveDraft }: PitchFormProps) {
  const field = (
    key: Exclude<keyof PitchDraft, 'compensation' | 'category'>,
    label: string,
    multiline = false,
    type = 'text'
  ) => (
    <label>
      {label}
      {multiline ? (
        <textarea
          aria-label={label}
          rows={key === 'description' ? 6 : 3}
          value={draft[key]}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          onChange={(event) => onChange({ [key]: event.target.value })}
        />
      ) : (
        <input
          aria-label={label}
          type={type}
          value={draft[key]}
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
        onReview();
      }}
    >
      {field('title', 'Pitch title')}
      <label>
        Generated slug
        <input readOnly value={pitchSlug(draft.title)} />
        <small>Generated from the title. The server will confirm uniqueness when submission is connected.</small>
      </label>
      <div className={styles.row}>
        {field('editorEmail', 'Recipient editor email', false, 'email')}
        <label>
          Category
          <select
            aria-label="Category"
            value={draft.category}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'category-error' : undefined}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            <option value="">Choose a category</option>
            {TOPICS.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
          {errors.category && (
            <span id="category-error" className={styles.error}>
              {errors.category}
            </span>
          )}
        </label>
      </div>
      {field('summary', 'Summary', true)}
      {field('description', 'Story angle and reporting plan', true)}
      <div className={styles.row}>
        {field('location', 'Location')}
        {field('length', 'Proposed length or duration')}
        {field('deadline', 'Proposed delivery date', false, 'date')}
      </div>
      <CompensationFields
        value={draft.compensation}
        onChange={(compensation) => onChange({ compensation })}
        error={errors.compensation}
      />
      {field('inviteEmails', 'Collaborator emails (optional)', true)}
      <p>Separate collaborator emails with commas. Saving a draft does not send invitations.</p>
      <div className={styles.actions}>
        <button type="button" onClick={onSaveDraft}>
          Save draft
        </button>
        <button type="submit">Review pitch</button>
      </div>
    </form>
  );
}
