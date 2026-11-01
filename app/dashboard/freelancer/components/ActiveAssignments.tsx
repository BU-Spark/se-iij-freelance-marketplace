import type { DeskAssignment } from '../../../types/dashboard.types';
import { TaskCard } from './TaskCard';
import styles from '../freelancer.module.css';
export type ActiveAssignmentsProps = { active: DeskAssignment[]; freelancerId: string };
export function ActiveAssignments({ active, freelancerId }: ActiveAssignmentsProps) {
  return (
    <section id="active-assignments" aria-labelledby="active-heading" className={styles.section}>
      <h2 id="active-heading">In progress</h2>
      <p>Your assigned work, ordered by deadline.</p>
      {active.length ? (
        <ul className={styles.grid}>
          {active.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} freelancerId={freelancerId} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No assignments in progress.</p>
      )}
    </section>
  );
}
