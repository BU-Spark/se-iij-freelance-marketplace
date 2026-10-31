import type { PitchDraft } from '../../types/pitchForm.types';
import { pitchInviteEmails, pitchSlug } from './pitchForm.utils';
import styles from './PitchForm.module.css';
export type PitchPreviewProps = { draft: PitchDraft; onEdit: () => void; onSaveDraft: () => void };
export function PitchPreview({ draft, onEdit, onSaveDraft }: PitchPreviewProps) {
  return (
    <section aria-label="Pitch preview" className={styles.preview}>
      <h2>{draft.title}</h2>
      <p>{pitchSlug(draft.title)}</p>
      <dl>
        {[
          ['Recipient editor', draft.editorEmail],
          ['Category', draft.category],
          ['Summary', draft.summary],
          ['Reporting plan', draft.description],
          ['Location', draft.location],
          ['Length', draft.length],
          ['Delivery date', draft.deadline],
          ['Compensation', `${draft.compensation.currency} ${draft.compensation.amount} / ${draft.compensation.unit}`],
          ['Collaborators', pitchInviteEmails(draft.inviteEmails).join(', ') || 'None'],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.actions}>
        <button type="button" onClick={onEdit}>
          Back to editing
        </button>
        <button type="button" onClick={onSaveDraft}>
          Save draft
        </button>
        <button type="button" disabled title="Pitch submission will be available after backend integration">
          Submit pitch
        </button>
      </div>
      <p>
        Submission is not connected yet. Your draft can be saved in this browser; it has not been sent to an editor.
      </p>
    </section>
  );
}
