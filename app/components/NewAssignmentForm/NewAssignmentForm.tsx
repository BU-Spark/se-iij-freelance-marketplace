import ChipGroup from '../ChipGroup/ChipGroup';
import Field from '../Field/Field';
import type { NewAssignment } from '../../types/assignments.types';
import { slugify, type AssignmentErrors } from '../../utils/assignment.utils';
import { PROJECT_TYPES } from '../NewAssignmentDrawer/constants';
import styles from './NewAssignmentForm.module.css';

type NewAssignmentFormProps = {
  draft: NewAssignment;
  /** called with just the field(s) that changed, e.g. { title: 'City council' } */
  onChange: (patch: Partial<NewAssignment>) => void;
  errors?: AssignmentErrors;
};

export default function NewAssignmentForm({ draft, onChange, errors }: NewAssignmentFormProps) {
  // preview only; the random code is added when the editor posts
  const slugBase = slugify(draft.title);

  return (
    <div className={styles.form}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Project type</legend>
        {/* ChipGroup allows many; we keep only the one just clicked */}
        <ChipGroup
          options={PROJECT_TYPES}
          selected={draft.category ? [draft.category] : []}
          onToggle={(type) => onChange({ category: type })}
        />
        {errors?.category && (
          <p className={styles.error} role="alert">
            {errors.category}
          </p>
        )}
      </fieldset>

      <Field label="Title" error={errors?.title}>
        <input
          className={styles.input}
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. City council overnight vote"
        />
      </Field>

      <div>
        <Field label="Slug" error={errors?.slug}>
          <output className={`${styles.slug} ${slugBase ? '' : styles.slugEmpty}`}>
            {slugBase ? `${slugBase}-······` : 'Fills in from the title'}
          </output>
        </Field>
      </div>

      <div className={styles.row}>
        <Field label="Point of contact">
          <input
            className={styles.input}
            value={draft.contact}
            onChange={(e) => onChange({ contact: e.target.value })}
            placeholder="Editor name & desk"
          />
        </Field>
        <Field label="Location">
          <input
            className={styles.input}
            value={draft.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Remote / address"
          />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label="Length / time">
          <input
            className={styles.input}
            value={draft.length}
            onChange={(e) => onChange({ length: e.target.value })}
            placeholder="e.g. 800 words / 4 hours"
          />
        </Field>
        <Field label="Deadline" error={errors?.deadline}>
          <input
            type="datetime-local"
            className={styles.input}
            value={draft.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
          />
        </Field>
      </div>

      <div>
        <Field label="Compensation">
          <input
            className={styles.input}
            value={draft.compensation}
            onChange={(e) => onChange({ compensation: e.target.value })}
            placeholder="e.g. $750 flat, $0.50/word, $85/hr"
          />
        </Field>
        <p className={styles.hint}>Freelancers may have negotiated rates, so edit as needed.</p>
      </div>

      <Field label="Description">
        <textarea
          className={styles.input}
          rows={4}
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Angle, requirements, must-haves…"
        />
      </Field>
    </div>
  );
}
