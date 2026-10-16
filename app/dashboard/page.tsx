import Link from 'next/link';
import { Header } from '../components/header/Header';
import SegmentedControl, { type SegmentOption } from './components/SegmentedControl';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, EDITOR_NAME, NEW_PITCHES, ROSTER } from './constants';
import {
  countByStatus,
  countOnRoster,
  formatDeadline,
  formatDeskDate,
  formatRate,
  hourSlots,
  SLOT_STARTS,
  slotLabel,
} from '../utils/dashboard.utils';
import type { DeskFilter, RosterView } from '../types/dashboard.types';

/*
 * Dashboard: status bar, section headings and toggles are styled.
 * Roster and assignment cards get styled in the next PRs.
 */

const VIEWS: SegmentOption<RosterView>[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

const FILTERS: SegmentOption<DeskFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'assigned', label: 'Assigned' },
];

export default function Dashboard() {
  const counts = countByStatus(ASSIGNMENTS);

  return (
    <div className={styles.shell}>
      <Header />

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar}>
        <p>
          <strong>{formatDeskDate(new Date())}</strong> • Editor: {EDITOR_NAME} •{' '}
          <Link href="/dashboard/pitches" className={styles.inboxLink}>
            {NEW_PITCHES} new pitches in inbox →
          </Link>
        </p>
        <ul aria-label="Assignment counts" className={styles.counts}>
          <li style={{ ['--dot' as string]: 'var(--c-blue)' }}>{counts.open} open</li>
          <li style={{ ['--dot' as string]: 'var(--c-amber)' }}>{counts.invited} pending</li>
          <li style={{ ['--dot' as string]: 'var(--c-green)' }}>{counts.assigned} assigned</li>
        </ul>
      </div>

      <main className={styles.columns}>
        {/* ---- Left column: who is available ---- */}
        <section aria-labelledby="availability-heading">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="availability-heading" className={styles.sectionTitle}>
                Availability
              </h2>
              <p className={styles.sectionSub}>
                {countOnRoster(ROSTER)} of {ROSTER.length} on roster
              </p>
            </div>
            <SegmentedControl label="Availability range" options={VIEWS} value="day" />
          </div>

          <ul className={styles.list}>
            {ROSTER.map((m) => {
              const slots = hourSlots(m.openHours);
              return (
                <li key={m.id} className={styles.placeholder}>
                  <h3>{m.name}</h3>
                  <p>
                    {m.specialty} • {m.city}
                  </p>
                  <p>{m.status}</p>
                  <p>
                    Free:{' '}
                    {SLOT_STARTS.filter((_, i) => slots[i])
                      .map(slotLabel)
                      .join(' ') || 'none today'}
                  </p>
                  <p>{m.note}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ---- Right column: assignments ---- */}
        <section aria-labelledby="assignments-heading">
          <div className={styles.sectionHead}>
            <h2 id="assignments-heading" className={styles.sectionTitle}>
              Assignments
            </h2>
            <SegmentedControl label="Filter assignments" options={FILTERS} value="all" />
          </div>

          <ul className={styles.list}>
            {ASSIGNMENTS.map((a) => (
              <li key={a.id} className={styles.placeholder}>
                <article>
                  <p>
                    {a.category} • {a.urgent ? 'Urgent' : a.status}
                  </p>
                  <h3>{a.title}</h3>
                  <p>
                    Point of Contact: {a.contact.name}, {a.contact.desk}
                  </p>
                  <p>Deadline: {formatDeadline(a.deadline)}</p>
                  <p>
                    Location: {a.location} • Length: {a.length} • Type: {a.type} • Rate: {formatRate(a.rate)}
                  </p>
                  <p>{a.interestedIds.length} interested</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
