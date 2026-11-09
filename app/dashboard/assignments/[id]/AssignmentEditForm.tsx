'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NewAssignmentForm from '../../../components/NewAssignmentForm/NewAssignmentForm';
import type { Assignment, NewAssignment } from '../../../types/assignments.types';
import {
  assignmentToDraft,
  hasErrors,
  validateAssignment,
  validateCompensation,
  type AssignmentErrors,
} from '../../../utils/assignment.utils';
import styles from './assignmentDetail.module.css';

type AssignmentEditFormProps = {
  assignment: Assignment;
  /** called when the editor cancels; nothing is saved */
  onCancel: () => void;
  /** called after the server has saved the changes */
  onSaved: () => void;
};

type SaveResponse = { error?: string; errors?: AssignmentErrors };

/** The New Assignment form, filled with a saved assignment, that PATCHes the changes */
export default function AssignmentEditForm({ assignment: a, onCancel, onSaved }: AssignmentEditFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<NewAssignment>(() => assignmentToDraft(a));
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateDraft = (patch: Partial<NewAssignment>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFormError('');
    // drop the error for any field the editor just touched
    setErrors((current) => {
      const touched = Object.keys(patch) as Array<keyof NewAssignment>;
      if (!touched.some((field) => current[field])) return current;
      const next = { ...current };
      touched.forEach((field) => delete next[field]);
      return next;
    });
  };

  const save = async () => {
    const nextErrors: AssignmentErrors = { ...validateAssignment(draft) };
    const compensationError = validateCompensation(draft.compensation);
    if (compensationError) nextErrors.compensation = compensationError;
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    setFormError('');

    try {
      const response = await fetch(`/api/assignments/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          // datetime-local values have no timezone; send an absolute instant
          deadline: draft.deadline ? new Date(draft.deadline).toISOString() : '',
        }),
      });
      const payload = (await response.json().catch(() => null)) as SaveResponse | null;

      if (!response.ok) {
        setFormError(payload?.error ?? 'Unable to save the assignment. Please try again.');
        if (payload?.errors) setErrors(payload.errors);
        return;
      }

      onSaved();
      router.refresh();
    } catch {
      setFormError('Unable to save the assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.card} aria-labelledby="edit-assignment-title">
      <h1 id="edit-assignment-title" className={styles.title}>
        Edit assignment
      </h1>
      {formError && (
        <p role="alert" className={styles.formError}>
          {formError}
        </p>
      )}
      <NewAssignmentForm draft={draft} onChange={updateDraft} errors={errors} savedSlug={a.slug} />
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className={styles.primary} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}
