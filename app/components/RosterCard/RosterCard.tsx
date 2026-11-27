import type { ReactNode } from 'react';
import type { AvailabilityStatus, RosterMember, RosterView } from '../../types/dashboard.types';
import { DayStrip, MonthGrid, WeekStrip } from './AvailabilityStrips';
import RosterCardLayout from './RosterCardLayout';
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
    <RosterCardLayout
      name={member.name}
      meta={[member.specialty, member.city].filter(Boolean).join(' · ')}
      status={{ tone: member.status, label: STATUS_LABEL[member.status] }}
      className={member.status === 'off' ? styles.dimmed : undefined}
      footer={footer}
    >
      {view === 'day' && <DayStrip member={member} />}
      {view === 'week' && <WeekStrip member={member} />}
      {view === 'month' && <MonthGrid member={member} />}

      {/* the note talks about today, so only show it in the day view */}
      {view === 'day' && <p className={styles.note}>{member.note}</p>}
    </RosterCardLayout>
  );
}
