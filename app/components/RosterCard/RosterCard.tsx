import Avatar from '../Avatar/Avatar';
import type { AvailabilityStatus, RosterMember, RosterView } from '../../types/dashboard.types';
import { hourSlots, SLOT_STARTS, slotLabel } from '../../utils/dashboard.utils';
import styles from './RosterCard.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off today',
};

type RosterCardProps = {
  member: RosterMember;
  view?: RosterView;
};

export default function RosterCard({ member, view = 'day' }: RosterCardProps) {
  // one true/false per time box: 8a, 10a, 12p, 2p, 4p, 6p
  const slots = hourSlots(member.openHours);

  return (
    <article className={`${styles.card} ${member.status === 'off' ? styles.dimmed : ''}`}>
      <div className={styles.top}>
        <Avatar name={member.name} />
        <div className={styles.who}>
          <h3 className={styles.name}>{member.name}</h3>
          <p className={styles.meta}>
            {member.specialty} · {member.city}
          </p>
        </div>
        <span className={`${styles.pill} ${styles[member.status]}`}>{STATUS_LABEL[member.status]}</span>
      </div>

      {view === 'day' ? (
        <ul className={styles.slots} aria-label="Free time today">
          {SLOT_STARTS.map((hour, i) => (
            <li key={hour} className={slots[i] ? styles.free : styles.taken}>
              {slotLabel(hour)} <span className={styles.srOnly}>{slots[i] ? 'free' : 'busy'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.rangeNotice}>
          {view === 'week'
            ? 'Weekly availability details are not provided.'
            : 'Monthly availability details are not provided.'}
        </p>
      )}

      <p className={styles.note}>{member.note}</p>
    </article>
  );
}
