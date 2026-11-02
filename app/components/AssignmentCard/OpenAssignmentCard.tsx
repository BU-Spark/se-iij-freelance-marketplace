import type { Assignment } from '../../types/assignments.types';
import { formatCompensation } from '../../utils/assignment.utils';
import { categoryColor } from '../../utils/category.utils';
import { formatDeadline } from '../../utils/dashboard.utils';
import styles from './AssignmentCard.module.css';

type OpenAssignmentCardProps = {
  assignment: Assignment;
};

/** A read-only card for the assignment discovery page; no editor-only actions. */
export default function OpenAssignmentCard({ assignment: a }: OpenAssignmentCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.category}>
          <span className={styles.dot} style={{ background: categoryColor(a.category) }} aria-hidden="true" />
          {a.category}
        </span>
        <span className={`${styles.pill} ${styles.open}`}>Open</span>
        {a.deadline && <span className={styles.deadline}>Due {formatDeadline(new Date(a.deadline))}</span>}
      </div>

      <div>
        <h3 className={styles.title}>{a.title}</h3>
        {a.contact && <p className={styles.contact}>Point of contact: {a.contact}</p>}
      </div>

      <dl className={styles.details}>
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
    </article>
  );
}
