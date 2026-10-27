import Avatar from '../Avatar/Avatar';
import type { Pitch, PitchStatus } from '../../types/dashboard.types';
import { categoryColor } from '../../utils/category.utils';
import { timeAgo } from '../../utils/dashboard.utils';
import styles from './PitchListItem.module.css';

const STATUS_LABEL: Record<PitchStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  negotiating: 'Negotiating',
  accepted: 'Accepted',
  declined: 'Declined',
};
type PitchListItemProps = {
  pitch: Pitch;
  /** true for the pitch currently open on the right */
  selected: boolean;
  onSelect: () => void;
};

export default function PitchListItem({ pitch, selected, onSelect }: PitchListItemProps) {
  return (
    // a real button, so it works with the keyboard (Tab + Enter) too
    <button
      type="button"
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <Avatar name={pitch.freelancer.name} size={40} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.category}>
            <span className={styles.dot} style={{ background: categoryColor(pitch.category) }} aria-hidden="true" />
            {pitch.category}
          </span>
          <span className={`${styles.pill} ${styles[pitch.status]}`}>{STATUS_LABEL[pitch.status]}</span>
        </span>
        <span className={styles.slug}>{pitch.slug}</span>
        <span className={styles.meta}>
          {pitch.freelancer.name} · {timeAgo(pitch.submittedAt)}
        </span>
      </span>
    </button>
  );
}
