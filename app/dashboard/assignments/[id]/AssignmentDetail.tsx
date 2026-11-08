'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NewAssignmentForm from '../../../components/NewAssignmentForm/NewAssignmentForm';
import type { Assignment, NewAssignment } from '../../../types/assignments.types';
import {
  assignmentToDraft,
  formatCompensation,
  hasErrors,
  validateAssignment,
  validateCompensation,
  type AssignmentErrors,
} from '../../../utils/assignment.utils';
import { categoryColor } from '../../../utils/category.utils';
import styles from './assignmentDetail.module.css';

type AssignmentDetailProps = {
  assignment: Assignment;
  /** true for editors from the organization that posted it */
  canEdit: boolean;
  /** true for the sample desk data, which is not saved anywhere */
  isSample?: boolean;
};

const STATUS_LABEL: Record<Assignment['status'], string> = {
  open: 'Open',
  invited: 'Invited',
  assigned: 'Assigned',
};

const formatDateTime = (date: Date | null) =>
  date
    ? new Date(date).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'No deadline';

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

type SaveResponse = { error?: string; errors?: AssignmentErrors };

export default function AssignmentDetail({ assignment: a, canEdit, isSample = false }: AssignmentDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NewAssignment>(() => assignmentToDraft(a));
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDraft(assignmentToDraft(a));
    setErrors({});
    setFormError('');
    setEditing(true);
  };

  const updateDraft = (patch: Partial<NewAssignment>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFormError('');
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

      setEditing(false);
      router.refresh();
    } catch {
      setFormError('Unable to save the assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.main}>
      <Link href={isSample ? '/dashboard' : '/dashboard/assignments'} className={styles.backLink}>
        {isSample ? '← Back to dashboard' : '← Back to assignments'}
      </Link>

      {editing ? (
        <section className={styles.card} aria-labelledby="edit-assignment-title">
          <h1 id="edit-assignment-title" className={styles.editTitle}>
            Edit assignment
          </h1>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}
            </p>
          )}
          <NewAssignmentForm draft={draft} onChange={updateDraft} errors={errors} savedSlug={a.slug} />
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className={styles.primary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </section>
      ) : (
        <article className={styles.card}>
          <div className={styles.top}>
            <span className={styles.category}>
              <span className={styles.dot} style={{ background: categoryColor(a.category) }} aria-hidden="true" />
              {a.category}
            </span>
            <span className={`${styles.pill} ${styles[a.status]}`}>{STATUS_LABEL[a.status]}</span>
            {canEdit && (
              <button type="button" className={styles.editButton} onClick={startEditing}>
                Edit
              </button>
            )}
          </div>

          <div>
            <h1 className={styles.title}>{a.title}</h1>
            {a.contact && <p className={styles.contact}>Point of contact: {a.contact}</p>}
          </div>

          <dl className={styles.details}>
            <div>
              <dt>Deadline</dt>
              <dd>{formatDateTime(a.deadline)}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{a.location || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Length</dt>
              <dd>{a.length || 'Not specified'}</dd>
            </div>
            <div>
              <dt>Compensation</dt>
              <dd>{formatCompensation(a.compensation) || 'Not specified'}</dd>
            </div>
          </dl>

          <section aria-labelledby="assignment-description">
            <h2 id="assignment-description" className={styles.sectionTitle}>
              Description
            </h2>
            <p className={styles.description}>{a.description || 'No description yet.'}</p>
          </section>

          {isSample ? (
            <p className={styles.meta}>
              Sample assignment for the demo desk. It isn&apos;t saved, so it can&apos;t be edited.
            </p>
          ) : (
            <p className={styles.meta}>
              Posted {formatDate(a.createdAt)}
              {new Date(a.updatedAt).getTime() !== new Date(a.createdAt).getTime() &&
                ` · Updated ${formatDate(a.updatedAt)}`}
              {' · '}
              <span className={styles.slug}>{a.slug}</span>
            </p>
          )}
        </article>
      )}
    </main>
  );
}
