import type { ReactNode } from 'react';
import type { DeskAssignment } from '../../../types/dashboard.types';
import { assignmentDrawerHref, formatDeadline, formatRate } from '../../../utils/dashboard.utils';
import { formatCompensation } from '../../../utils/assignment.utils';
import AssignmentCardLayout from '../../../components/AssignmentCard/AssignmentCardLayout';
import { taskStatus, FILTERS } from '../freelancer.utils';
import styles from '../freelancer.module.css';

/** `footer` holds controls under the details, e.g. the freelancer's answer to the task */
export type TaskCardProps = { task: DeskAssignment; freelancerId: string; footer?: ReactNode };

export function TaskCard({ task, freelancerId, footer }: TaskCardProps) {
  const status = taskStatus(task, freelancerId);
  return (
    <AssignmentCardLayout
      className={styles.taskCard}
      title={task.title}
      category={task.category}
      status={{
        tone: status === 'in-progress' ? 'assigned' : status,
        label: FILTERS.find((item) => item.value === status)!.label,
      }}
      urgent={task.urgent}
      // only open work can be read in full; invitations and assigned work stay summary-only for now
      href={task.status === 'open' ? assignmentDrawerHref('/dashboard/freelancer', task.id) : undefined}
      contact={[task.contact.name, task.contact.desk].filter(Boolean).join(' · ')}
      details={[
        { label: 'Location', value: task.location },
        {
          label: 'Compensation',
          value: task.rate ? formatRate(task.rate) : task.compensation ? formatCompensation(task.compensation) : '—',
        },
        { label: 'Deadline', value: task.deadline ? formatDeadline(task.deadline) : '—' },
        { label: 'Type / length', value: [task.type, task.length].filter(Boolean).join(' · ') },
      ]}
      footer={footer}
    />
  );
}
