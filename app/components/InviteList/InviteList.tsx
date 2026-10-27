import Avatar from '../Avatar/Avatar';
import type { AvailabilityStatus, RosterMember } from '../../types/dashboard.types';
import styles from './InviteList.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off',
};

type InviteListProps = {
  members: RosterMember[];
  /** ids of the people who are ticked */
  selected: string[];
  onToggle: (id: string) => void;
};

export default function InviteList({ members, selected, onToggle }: InviteListProps) {
  return (
    <section className={styles.wrap} aria-labelledby="invite-heading">
      <div className={styles.head}>
        <h3 id="invite-heading" className={styles.heading}>
          Invite freelancers
        </h3>
        {/* aria-live: screen readers announce the new count when it changes */}
        <span className={styles.count} aria-live="polite">
          {selected.length} selected
        </span>
      </div>
      <p className={styles.tip}>Tip: skip this to post as an open call to the whole roster.</p>

      <ul className={styles.list}>
        {members.map((m) => {
          const off = m.status === 'off';
          return (
            <li key={m.id}>
              {/* the whole row is a label, so clicking anywhere on it ticks the box */}
              <label className={`${styles.row} ${off ? styles.disabled : ''}`}>
                <Avatar name={m.name} size={36} />
                <span className={styles.who}>
                  <span className={styles.name}>{m.name}</span>
                  <span className={styles.meta}>
                    {m.city} · {STATUS_LABEL[m.status]}
                  </span>
                </span>
                <input
                  type="checkbox"
                  className={styles.check}
                  checked={selected.includes(m.id)}
                  disabled={off}
                  onChange={() => onToggle(m.id)}
                />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
