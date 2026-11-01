import type { DeskAssignment } from '../../types/dashboard.types';
import { TaskCard, ActiveAssignments } from './components';
import styles from './freelancer.module.css';
export type FreelancerDashboardProps = { assignments: DeskAssignment[]; freelancerId: string };
export default function FreelancerDashboard({ assignments, freelancerId }: FreelancerDashboardProps) {
  const relevant = assignments
    .filter(
      (task) =>
        task.status === 'open' ||
        (task.status === 'invited' && task.invitedIds?.includes(freelancerId)) ||
        (task.status === 'assigned' && task.assignedToId === freelancerId)
    )
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  const active = relevant.filter((task) => task.status === 'assigned' && task.assignedToId === freelancerId);
  return (
    <>
      <ActiveAssignments active={active} freelancerId={freelancerId} />
      <section id="task-feed" tabIndex={-1} aria-labelledby="feed-heading" className={styles.section}>
        <h2 id="feed-heading">Task feed</h2>
        <p>Open opportunities, your invitations, and your ongoing work. Soonest deadlines first.</p>
        {relevant.length ? (
          <ul className={styles.grid}>
            {relevant.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} freelancerId={freelancerId} />
              </li>
            ))}
          </ul>
        ) : (
          <p>No tasks available.</p>
        )}
      </section>
    </>
  );
}
