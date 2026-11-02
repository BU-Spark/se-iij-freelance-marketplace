import type { FeedFilter } from '../freelancer.utils';
import styles from '../freelancer.module.css';
export type TaskSummaryProps = {
  openCount: number;
  invitedCount: number;
  activeCount: number;
  onSelect: (status: FeedFilter) => void;
};
export function TaskSummary({ openCount, invitedCount, activeCount, onSelect }: TaskSummaryProps) {
  return (
    <ul className={styles.summary} aria-label="Task summary">
      <li>
        <a href="#task-feed" onClick={() => onSelect('open')}>
          <strong>{openCount}</strong> Open opportunities
        </a>
      </li>
      <li>
        <a href="#task-feed" onClick={() => onSelect('invited')}>
          <strong>{invitedCount}</strong> Invitations
        </a>
      </li>
      <li>
        <a href="#task-feed" onClick={() => onSelect('in-progress')}>
          <strong>{activeCount}</strong> In progress
        </a>
      </li>
    </ul>
  );
}
