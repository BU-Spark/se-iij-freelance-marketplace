import type { FeedFilter } from '../freelancer.utils';
import styles from '../../dashboard.module.css';
export type TaskSummaryProps = {
  openCount: number;
  invitedCount: number;
  activeCount: number;
  onSelect: (status: FeedFilter) => void;
};
export function TaskSummary({ openCount, invitedCount, activeCount, onSelect }: TaskSummaryProps) {
  return (
    <ul className={styles.counts} aria-label="Task summary">
      <li style={{ ['--dot' as string]: 'var(--c-blue)' }}>
        <a href="#task-feed" onClick={() => onSelect('open')}>
          {openCount} open opportunities
        </a>
      </li>
      <li style={{ ['--dot' as string]: 'var(--c-amber)' }}>
        <a href="#task-feed" onClick={() => onSelect('invited')}>
          {invitedCount} invitations
        </a>
      </li>
      <li style={{ ['--dot' as string]: 'var(--c-green)' }}>
        <a href="#task-feed" onClick={() => onSelect('in-progress')}>
          {activeCount} in progress
        </a>
      </li>
    </ul>
  );
}
