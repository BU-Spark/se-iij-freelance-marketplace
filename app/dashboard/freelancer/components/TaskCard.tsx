import type { DeskAssignment } from '../../../types/dashboard.types';
import { formatDeadline, formatRate } from '../../../utils/dashboard.utils';
import { formatCompensation } from '../../../utils/assignment.utils';
import { taskStatus, FILTERS } from '../freelancer.utils';
import styles from '../freelancer.module.css';

export type TaskCardProps = { task: DeskAssignment; freelancerId: string };

export function TaskCard({ task, freelancerId }: TaskCardProps) {
  const status = taskStatus(task, freelancerId);
  return (
    <article className={styles.card}>
      <div className={styles.tags}>
        <span className={styles[status]}>{FILTERS.find((item) => item.value === status)?.label}</span>
        {task.urgent && <span className={styles.urgent}>Urgent</span>}
        <span>{task.category}</span>
      </div>
      <h3>{task.title}</h3>
      <p>
        {task.contact.name} · {task.contact.desk}
      </p>
      <dl className={styles.details}>
        <div>
          <dt>Location</dt>
          <dd>{task.location}</dd>
        </div>
        <div>
          <dt>Compensation</dt>
          <dd>{task.rate ? formatRate(task.rate) : task.compensation ? formatCompensation(task.compensation) : '—'}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{task.deadline ? formatDeadline(task.deadline) : '—'}</dd>
        </div>
        <div>
          <dt>Type / length</dt>
          <dd>
            {task.type} · {task.length}
          </dd>
        </div>
      </dl>
    </article>
  );
}
