import type { AssignmentStatus, DeskAssignment } from '../../types/dashboard.types';
import { formatDeadline, formatRate } from '../../utils/dashboard.utils';
import styles from './AssignmentCard.module.css';

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  open: 'Open',
  invited: 'Invited',
  assigned: 'Assigned',
};

// colour of the small square next to the category name
const CATEGORY_COLOR: Record<string, string> = {
  'Reporting/Writing': '#2f55d4',
  Editing: '#c2417a',
  Photo: '#d98a00',
  Data: '#1f8a70',
};

type AssignmentCardProps = {
  assignment: DeskAssignment;
  /** name of the freelancer it was assigned to, if any */
  assignedName?: string;
  /** if given, shows a "Review candidates →" button when people are interested */
  onReview?: () => void;
};

// "3 interested", "No one interested yet", or "Assigned to Marcus Thorne"
function interestText(a: DeskAssignment, assignedName?: string): string {
  if (a.status === 'assigned') return assignedName ? `Assigned to ${assignedName}` : 'Assigned';
  const n = a.interestedIds.length;
  return n === 0 ? 'No one interested yet' : `${n} interested`;
}

export default function AssignmentCard({ assignment: a, assignedName, onReview }: AssignmentCardProps) {
  const canReview = onReview && a.status !== 'assigned' && a.interestedIds.length > 0;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <span className={styles.category}>
          <span
            className={styles.dot}
            style={{ background: CATEGORY_COLOR[a.category] ?? '#5f6878' }}
            aria-hidden="true"
          />
          {a.category}
        </span>
        {a.urgent && <span className={`${styles.pill} ${styles.urgent}`}>Urgent</span>}
        <span className={`${styles.pill} ${styles[a.status]}`}>{STATUS_LABEL[a.status]}</span>
        <span className={styles.deadline}>Due {formatDeadline(a.deadline)}</span>
      </div>

      <div>
        <h3 className={styles.title}>{a.title}</h3>
        <p className={styles.contact}>
          Point of contact: {a.contact.name}, {a.contact.desk}
        </p>
      </div>

      <dl className={styles.details}>
        <div>
          <dt>Location</dt>
          <dd>{a.location}</dd>
        </div>
        <div>
          <dt>Length</dt>
          <dd>{a.length}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{a.type}</dd>
        </div>
        <div>
          <dt>Rate</dt>
          <dd>{formatRate(a.rate)}</dd>
        </div>
      </dl>

      <div className={styles.footer}>
        <p className={styles.interest}>{interestText(a, assignedName)}</p>
        {canReview && (
          <button type="button" className={styles.review} onClick={onReview}>
            Review candidates →
          </button>
        )}
      </div>
    </article>
  );
}
