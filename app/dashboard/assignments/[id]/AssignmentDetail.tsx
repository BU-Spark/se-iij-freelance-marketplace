'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Assignment } from '../../../types/assignments.types';
import { formatCompensation } from '../../../utils/assignment.utils';
import { categoryColor } from '../../../utils/category.utils';
import cardStyles from '../../../components/AssignmentCard/AssignmentCard.module.css';
import listStyles from '../assignments.module.css';
import styles from './assignmentDetail.module.css';
import AssignmentEditForm from './AssignmentEditForm';

type AssignmentDetailProps = {
  assignment: Assignment;
  /** true for editors from the organization that posted it */
  canEdit?: boolean;
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

/** The expanded view of one assignment: every field, including the description */
export default function AssignmentDetail({ assignment: a, canEdit = false, isSample = false }: AssignmentDetailProps) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <main className={styles.main}>
        <AssignmentEditForm assignment={a} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Link href={isSample ? '/dashboard' : '/dashboard/assignments'} className={listStyles.backLink}>
        {isSample ? '← Back to dashboard' : '← Back to assignments'}
      </Link>

      <article className={styles.card}>
        <div className={cardStyles.top}>
          <span className={cardStyles.category}>
            <span className={cardStyles.dot} style={{ background: categoryColor(a.category) }} aria-hidden="true" />
            {a.category}
          </span>
          <span className={`${cardStyles.pill} ${cardStyles[a.status]}`}>{STATUS_LABEL[a.status]}</span>
          {canEdit && (
            <button type="button" className={styles.editButton} onClick={() => setEditing(true)}>
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
            Sample assignment for the demo desk. It isn&apos;t saved anywhere, so it can&apos;t be edited.
          </p>
        ) : (
          <p className={styles.meta}>
            Posted {formatDate(a.createdAt)}
            {new Date(a.updatedAt).getTime() !== new Date(a.createdAt).getTime() &&
              ` · Updated ${formatDate(a.updatedAt)}`}
          </p>
        )}
      </article>
    </main>
  );
}
