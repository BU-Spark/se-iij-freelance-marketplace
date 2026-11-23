import type { DeskAssignment } from '../../../types/dashboard.types';
import { TaskCard } from './TaskCard';
import { DEADLINE_LABEL, deadlineState } from '../freelancer.utils';
import badgeStyles from './DeadlineBadge.module.css';
import styles from '../freelancer.module.css';
import dashboardStyles from '../../dashboard.module.css';
export type ActiveAssignmentsProps = { active: DeskAssignment[]; freelancerId: string };
export function ActiveAssignments({ active, freelancerId }: ActiveAssignmentsProps) {
  return (
    <section id="active-assignments" aria-labelledby="active-heading">
      <div className={dashboardStyles.sectionHead}>
        <div>
          <h2 id="active-heading" className={dashboardStyles.sectionTitle}>
            In progress
          </h2>
          <p className={dashboardStyles.sectionSub}>Your assigned work, ordered by deadline</p>
        </div>
      </div>
      {active.length ? (
        <ul className={dashboardStyles.list}>
          {active.map((task) => {
            const due = deadlineState(task.deadline);
            return (
              <li key={task.id}>
                {due && <span className={`${badgeStyles.badge} ${badgeStyles[due]}`}>{DEADLINE_LABEL[due]}</span>}
                <TaskCard task={task} freelancerId={freelancerId} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={styles.emptyState}>No assignments in progress.</p>
      )}
    </section>
  );
}
