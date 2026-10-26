import Avatar from '../Avatar/Avatar';
import type { AvailabilityStatus, RosterMember, RosterView } from '../../types/dashboard.types';
import { hourSlots, SLOT_STARTS, slotLabel } from '../../utils/dashboard.utils';
import styles from './RosterCard.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off today',
};

const WEEKDAYS = [
  { short: 'M', long: 'Monday' },
  { short: 'T', long: 'Tuesday' },
  { short: 'W', long: 'Wednesday' },
  { short: 'T', long: 'Thursday' },
  { short: 'F', long: 'Friday' },
  { short: 'S', long: 'Saturday' },
  { short: 'S', long: 'Sunday' },
];

type RosterCardProps = {
  member: RosterMember;
  /** which availability strip to draw; "day" if not given */
  view?: RosterView;
};

export default function RosterCard({ member, view = 'day' }: RosterCardProps) {
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

      {view === 'day' && <DayStrip member={member} />}
      {view === 'week' && <WeekStrip member={member} />}
      {view === 'month' && <MonthGrid member={member} />}

      {/* the note talks about today, so only show it in the day view */}
      {view === 'day' && <p className={styles.note}>{member.note}</p>}
    </article>
  );
}

/** six 2-hour boxes: 8a … 6p */
function DayStrip({ member }: { member: RosterMember }) {
  const slots = hourSlots(member.openHours);
  return (
    <ul className={styles.slots} aria-label="Free time today">
      {SLOT_STARTS.map((hour, i) => (
        <li key={hour} className={slots[i] ? styles.free : styles.taken}>
          {slotLabel(hour)} <span className={styles.srOnly}>{slots[i] ? 'free' : 'busy'}</span>
        </li>
      ))}
    </ul>
  );
}

/** seven boxes: M … S */
function WeekStrip({ member }: { member: RosterMember }) {
  return (
    <ul className={styles.week} aria-label="Free days this week">
      {WEEKDAYS.map((d, i) => (
        <li key={d.long} className={member.weekDays[i] ? styles.free : styles.taken}>
          <span aria-hidden="true">{d.short}</span>
          <span className={styles.srOnly}>
            {d.long} {member.weekDays[i] ? 'free' : 'busy'}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** a small box per day of the month, 10 per row */
function MonthGrid({ member }: { member: RosterMember }) {
  return (
    <ul className={styles.month} aria-label="Free days this month">
      {member.monthDays.map((free, i) => (
        <li key={i} className={free ? styles.free : styles.taken}>
          <span className={styles.srOnly}>
            Day {i + 1} {free ? 'free' : 'busy'}
          </span>
        </li>
      ))}
    </ul>
  );
}
