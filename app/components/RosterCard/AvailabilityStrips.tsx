import type { RosterMember } from '../../types/dashboard.types';
import { hourSlots, SLOT_STARTS, slotLabel } from '../../utils/dashboard.utils';
import styles from './RosterCard.module.css';

const WEEKDAYS = [
  { short: 'M', long: 'Monday' },
  { short: 'T', long: 'Tuesday' },
  { short: 'W', long: 'Wednesday' },
  { short: 'T', long: 'Thursday' },
  { short: 'F', long: 'Friday' },
  { short: 'S', long: 'Saturday' },
  { short: 'S', long: 'Sunday' },
];

type StripProps = {
  member: RosterMember;
};

/** six 2-hour boxes: 8a … 6p */
export function DayStrip({ member }: StripProps) {
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
export function WeekStrip({ member }: StripProps) {
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

/** a small box per day, 10 per row; the real date is read out for screen readers */
export function MonthGrid({ member }: StripProps) {
  return (
    <ul className={styles.month} aria-label="Free days this month">
      {member.monthDays.map((free, i) => {
        const date = member.monthDayDates?.[i];
        const day = date ? `Day ${date.slice(8)}` : `Day ${i + 1}`;

        return (
          <li
            key={i}
            className={free ? styles.free : styles.taken}
            title={date ? `${date}: ${free ? 'free' : 'busy'}` : undefined}
          >
            <span className={styles.srOnly}>
              {day} {free ? 'free' : 'busy'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
