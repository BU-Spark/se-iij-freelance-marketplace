import Link from 'next/link';
import ReportButton from '../ReportButton/ReportButton';
import type { Assignment } from '../../types/assignments.types';
import { formatCompensation } from '../../utils/assignment.utils';
import { categoryColor } from '../../utils/category.utils';
import { formatDeadline } from '../../utils/dashboard.utils';
import styles from './AssignmentCard.module.css';

type OpenAssignmentCardProps = {
  assignment: Assignment;
  /** where clicking the card goes, e.g. the assignment's expanded view */
  href?: string;
};

/** A read-only card for the assignment discovery page; no editor-only actions. */
export default function OpenAssignmentCard({ assignment: a, href }: OpenAssignmentCardProps) {
  return (
    <article className={`${styles.card} ${href ? styles.clickable : ''}`}>
      <div className={styles.top}>
        <span className={styles.category}>
          <span className={styles.dot} style={{ background: categoryColor(a.category) }} aria-hidden="true" />
          {a.category}
        </span>
        <span className={`${styles.pill} ${styles.open}`}>Open</span>
        {a.deadline && <span className={styles.deadline}>Due {formatDeadline(new Date(a.deadline))}</span>}
        <ReportButton targetType="assignment" targetId={a.id} targetLabel={a.title} compact />
      </div>

      <div>
        <h3 className={styles.title}>
          {href ? (
            <Link href={href} className={styles.cardLink} scroll={false}>
              {a.title}
            </Link>
          ) : (
            a.title
          )}
        </h3>
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
