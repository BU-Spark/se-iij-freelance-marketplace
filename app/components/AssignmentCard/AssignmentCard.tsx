import type { AssignmentStatus, DeskAssignment } from '../../types/dashboard.types';
import { formatCompensation } from '../../utils/assignment.utils';
import { formatRate } from '../../utils/dashboard.utils';
import { organizationName } from '../../utils/organization.utils';
import AssignmentCardLayout from './AssignmentCardLayout';
import styles from './AssignmentCard.module.css';

const STATUS_LABEL: Record<AssignmentStatus, string> = {
  open: 'Open',
  invited: 'Invited',
  assigned: 'Assigned',
};

type AssignmentCardProps = {
  assignment: DeskAssignment;
  /** name of the freelancer it was assigned to, if any */
  assignedName?: string;
  /** if given, shows a "Review candidates →" button when people are interested or invited */
  onReview?: () => void;
};

// "3 interested", "4 invited", or "Assigned to Marcus Thorne"
function interestText(a: DeskAssignment, assignedName?: string): string {
  if (a.status === 'assigned') return assignedName ? `Assigned to ${assignedName}` : 'Assigned';
  const interested = a.interestedIds.length;
  const invited = a.invitedIds?.length ?? 0;
  if (interested === 0) return invited > 0 ? `${invited} invited` : 'No one interested yet';
  return invited > 0 ? `${interested} interested · ${invited} invited` : `${interested} interested`;
}

export default function AssignmentCard({ assignment: a, assignedName, onReview }: AssignmentCardProps) {
  const canReview =
    onReview && a.status !== 'assigned' && (a.interestedIds.length > 0 || (a.invitedIds?.length ?? 0) > 0);
  const contactLine = [a.contact.name, a.contact.desk].filter(Boolean).join(', ');
  const organization = organizationName(a.organizationId);

  const details = [
    { label: 'Location', value: a.location || 'Not specified' },
    { label: 'Length', value: a.length || 'Not specified' },
  ];
  if (a.type) details.push({ label: 'Type', value: a.type });
  if (a.rate) details.push({ label: 'Rate', value: formatRate(a.rate) });
  else if (a.compensation) details.push({ label: 'Compensation', value: formatCompensation(a.compensation) });

  return (
    <AssignmentCardLayout
      title={a.title}
      category={a.category}
      status={{ tone: a.status, label: STATUS_LABEL[a.status] }}
      urgent={a.urgent}
      deadline={a.deadline}
      href={a.href}
      organization={organization ?? undefined}
      contact={contactLine && `Point of contact: ${contactLine}`}
      details={details}
      footer={
        <div className={styles.footer}>
          <p className={styles.interest}>{interestText(a, assignedName)}</p>
          {canReview && (
            <button type="button" className={styles.review} onClick={onReview}>
              Review candidates →
            </button>
          )}
        </div>
      }
    />
  );
}
