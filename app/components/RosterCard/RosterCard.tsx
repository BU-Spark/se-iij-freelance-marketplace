import type { ReactNode } from 'react';
import Avatar from '../Avatar/Avatar';
import type { AvailabilityStatus, RosterMember, RosterView } from '../../types/dashboard.types';
import { DayStrip, MonthGrid, WeekStrip } from './AvailabilityStrips';
import styles from './RosterCard.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off today',
};

type RosterCardProps = {
  member: RosterMember;
  /** which availability strip to draw; "day" if not given */
  view?: RosterView;
  /** extra row at the bottom, e.g. the roster page's "Remove" control */
  footer?: ReactNode;
};

export default function RosterCard({ member, view = 'day', footer }: RosterCardProps) {
  return (
    <article className={`${styles.card} ${member.status === 'off' ? styles.dimmed : ''}`}>
      <div className={styles.top}>
        <Avatar name={member.name} />
        <div className={styles.who}>
          <h3 className={styles.name}>{member.name}</h3>
          <p className={styles.meta}>{[member.specialty, member.city].filter(Boolean).join(' · ')}</p>
        </div>
        <span className={`${styles.pill} ${styles[member.status]}`}>{STATUS_LABEL[member.status]}</span>
      </div>

      {view === 'day' && <DayStrip member={member} />}
      {view === 'week' && <WeekStrip member={member} />}
      {view === 'month' && <MonthGrid member={member} />}

      {/* the note talks about today, so only show it in the day view */}
      {view === 'day' && <p className={styles.note}>{member.note}</p>}

      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  );
}
