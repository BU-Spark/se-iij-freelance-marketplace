import { Suspense } from 'react';
import Link from 'next/link';
import { Header } from '../components/header/Header';
import SegmentedControl, { type SegmentOption } from './components/SegmentedControl';
import AvailabilityColumn from './components/AvailabilityColumn';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, EDITOR_NAME, NEW_PITCHES, ROSTER } from './constants';
import { AssignmentCard, NewAssignmentFromUrl } from '../components';
import { countByStatus, formatDeskDate } from '../utils/dashboard.utils';
import type { DeskFilter } from '../types/dashboard.types';

/*
 * Dashboard: availability (day / week / month) on the left, assignments on the right.
 * The New Assignment drawer opens when the URL has ?new=assignment.
 */

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
        <AvailabilityColumn roster={ROSTER} />

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
              <li key={a.id}>
                <AssignmentCard assignment={a} />
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* reads ?new=assignment from the URL; Suspense is required by useSearchParams */}
      <Suspense fallback={null}>
        <NewAssignmentFromUrl closeHref="/dashboard" />
      </Suspense>
    </div>
  );
}
