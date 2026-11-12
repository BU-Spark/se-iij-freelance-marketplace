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
        onReview();
      }}
    >
      {field('title', 'Pitch title', false, 'text', 'e.g. Inside the city budget shortfall')}
      <label>
        <span className={styles.label}>Generated slug</span>
        <input readOnly className={styles.slug} value={pitchSlug(draft.title)} placeholder="Fills in from the title" />
      </label>
      <div className={styles.row}>
        {field('editorEmail', 'Recipient editor email', false, 'email', 'editor@outlet.com')}
        <label>
          <span className={styles.label}>Category</span>
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
        <p className={styles.hint}>Separate emails with commas. Saving a draft does not send invitations.</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={onSaveDraft}>
          Save draft
        </button>
        <button type="submit">Review pitch</button>
      </div>
    </form>
  );
}
