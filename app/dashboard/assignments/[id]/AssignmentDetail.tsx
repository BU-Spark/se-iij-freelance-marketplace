'use client';

import { useState } from 'react';
import type { Assignment, AssignmentFeedback } from '../../../types/assignments.types';
import { formatCompensation } from '../../../utils/assignment.utils';
import { categoryColor } from '../../../utils/category.utils';
import { organizationName } from '../../../utils/organization.utils';
import cardStyles from '../../../components/AssignmentCard/AssignmentCard.module.css';
import styles from './assignmentDetail.module.css';
import AssignmentEditForm from './AssignmentEditForm';
import AssignmentFeedbackForm from './AssignmentFeedbackForm';

type AssignmentDetailProps = {
  assignment: Assignment;
  /** true for editors from the organization that posted it */
  canEdit?: boolean;
  /** shows which organization posted it; the editor desk asks for it, the freelance browser does not yet */
  showOrganization?: boolean;
};

const STATUS_LABEL: Record<Assignment['status'], string> = {
  open: 'Open',
  invited: 'Invited',
  assigned: 'Assigned',
  completed: 'Completed',
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

/** The expanded view of one assignment, shown in the assignment drawer: every field, including the description */
export default function AssignmentDetail({
  assignment: a,
  canEdit = false,
  showOrganization = false,
}: AssignmentDetailProps) {
  const [editing, setEditing] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<AssignmentFeedback[]>([]);
  const organization = showOrganization ? organizationName(a.organizationId) : null;

  if (editing) {
    return <AssignmentEditForm assignment={a} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />;
  }

  return (
    <>
      <article className={styles.card}>
        <div className={cardStyles.top}>
          <span className={cardStyles.category}>
            <span className={cardStyles.dot} style={{ background: categoryColor(a.category) }} aria-hidden="true" />
            {a.category}
          </span>
          <span
            className={`${cardStyles.pill} ${a.status === 'completed' ? cardStyles.assigned : cardStyles[a.status]}`}
          >
            {STATUS_LABEL[a.status]}
          </span>
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
          {organization && (
            <div>
              <dt>Organization</dt>
              <dd>{organization}</dd>
            </div>
          )}
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

        <p className={styles.meta}>
          Posted {formatDate(a.createdAt)}
          {new Date(a.updatedAt).getTime() !== new Date(a.createdAt).getTime() &&
            ` · Updated ${formatDate(a.updatedAt)}`}
          {' · '}
          <span className={styles.slug}>{a.slug}</span>
        </p>
      </article>
      {a.status === 'completed' && (canEdit || feedbackHistory.length > 0) && (
        <AssignmentFeedbackForm
          feedbackHistory={feedbackHistory}
          canSubmit={canEdit}
          onSubmit={(feedback) =>
            setFeedbackHistory((history) => [{ ...feedback, submittedBy: 'You', submittedAt: new Date() }, ...history])
          }
        />
      )}
    </>
  );
}
