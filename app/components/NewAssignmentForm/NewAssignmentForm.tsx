import ChipGroup from '../ChipGroup/ChipGroup';
import Field from '../Field/Field';
import type { NewAssignmentDraft } from '../../types/dashboard.types';
import { PROJECT_TYPES } from '../NewAssignmentDrawer/constants';
import styles from './NewAssignmentForm.module.css';
type NewAssignmentFormProps = {
  draft: NewAssignmentDraft;
  /** called with just the field(s) that changed, e.g. { slug: 'city-council' } */
  onChange: (patch: Partial<NewAssignmentDraft>) => void;
};

export default function NewAssignmentForm({ draft, onChange }: NewAssignmentFormProps) {
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
      </fieldset>

      <Field label="Slug">
        <input
          className={styles.input}
          value={draft.slug}
          onChange={(e) => onChange({ slug: e.target.value })}
          placeholder="e.g. city-council-overnight"
        />
      </Field>

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
        <Field label="Deadline">
          <input
            className={styles.input}
            value={draft.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
            placeholder="e.g. Tonight, 11 PM"
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
