import ReportButton from '../ReportButton/ReportButton';
import type { Assignment } from '../../types/assignments.types';
import { formatCompensation } from '../../utils/assignment.utils';
import AssignmentCardLayout from './AssignmentCardLayout';

type OpenAssignmentCardProps = {
  assignment: Assignment;
  /** where clicking the card goes, e.g. the assignment's expanded view */
  href?: string;
};

/** A read-only card for the assignment discovery page; no editor-only actions. */
export default function OpenAssignmentCard({ assignment: a, href }: OpenAssignmentCardProps) {
  return (
    <AssignmentCardLayout
      title={a.title}
      category={a.category}
      status={{ tone: 'open', label: 'Open' }}
      deadline={a.deadline ? new Date(a.deadline) : null}
      action={<ReportButton targetType="assignment" targetId={a.id} targetLabel={a.title} compact />}
      href={href}
      contact={a.contact ? `Point of contact: ${a.contact}` : undefined}
      details={[
        { label: 'Location', value: a.location || 'Not specified' },
        { label: 'Length', value: a.length || 'Not specified' },
        { label: 'Compensation', value: formatCompensation(a.compensation) || 'Not specified' },
      ]}
    />
  );
}
