import { Suspense } from 'react';
import Link from 'next/link';
import { EditorHeader } from '../components/header/EditorHeader';
import AvailabilityColumn from './components/AvailabilityColumn';
import AssignmentsColumn from './components/AssignmentsColumn';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, EDITOR_NAME, NEW_PITCHES, ROSTER } from './constants';
import { NewAssignmentFromUrl } from '../components';
import { countByStatus, formatDeskDate } from '../utils/dashboard.utils';

/*
 * Dashboard: availability (day / week / month) on the left,
 * assignments (All / Open / Invited / Assigned) on the right.
 * The New Assignment drawer opens when the URL has ?new=assignment.
 */

export default function Dashboard() {
  const counts = countByStatus(ASSIGNMENTS);

  return (
    <div className={styles.shell}>
      <EditorHeader />

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
        <AssignmentsColumn assignments={ASSIGNMENTS} roster={ROSTER} />
      </main>

      {/* reads ?new=assignment from the URL; Suspense is required by useSearchParams */}
      <Suspense fallback={null}>
        <NewAssignmentFromUrl closeHref="/dashboard" roster={ROSTER} />
      </Suspense>
    </div>
  );
}
