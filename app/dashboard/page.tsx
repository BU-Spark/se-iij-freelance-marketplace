import { Suspense } from 'react';
import { EditorHeader } from '../components/header/EditorHeader';
import AvailabilityColumn from './components/AvailabilityColumn';
import AssignmentsColumn from './components/AssignmentsColumn';
import PageSearch from './components/PageSearch';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, ROSTER } from './constants';
import { NewAssignmentFromUrl } from '../components';
import type { Assignment } from '../types/assignments.types';
import { listOpenAssignments } from '../../lib/assignments';
import { countByStatus, formatDeskDate, toDeskAssignment } from '../utils/dashboard.utils';

/*
 * Dashboard: availability (day / week / month) on the left,
 * assignments (All / Open / Invited / Assigned) on the right.
 * The New Assignment drawer opens when the URL has ?new=assignment.
 */

// New posts have to appear as soon as the drawer sends the editor back here
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  let posted: Assignment[] = [];
  try {
    posted = await listOpenAssignments();
  } catch (error) {
    console.error('Failed to load assignments.', error);
  }

  // Assignments posted to the database sit above the sample desk data
  const assignments = [...posted.map(toDeskAssignment), ...ASSIGNMENTS];
  const counts = countByStatus(assignments);

  return (
    <div className={styles.shell}>
      <EditorHeader />

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar}>
        <div className={styles.statusLead}>
          <p>
            <strong>{formatDeskDate(new Date())}</strong>
          </p>
          {/* Generic for now: highlights matches in the columns, does not filter yet */}
          <PageSearch targetId="dashboard-columns" />
        </div>
        <ul aria-label="Assignment counts" className={styles.counts}>
          <li style={{ ['--dot' as string]: 'var(--c-blue)' }}>{counts.open} open</li>
          <li style={{ ['--dot' as string]: 'var(--c-amber)' }}>{counts.invited} pending</li>
          <li style={{ ['--dot' as string]: 'var(--c-green)' }}>{counts.assigned} assigned</li>
        </ul>
      </div>

      <main id="dashboard-columns" className={styles.columns}>
        {/* ---- Left column: who is available ---- */}
        <AvailabilityColumn roster={ROSTER} />

        {/* ---- Right column: assignments ---- */}
        <AssignmentsColumn assignments={assignments} roster={ROSTER} />
      </main>

      {/* reads ?new=assignment from the URL; Suspense is required by useSearchParams */}
      <Suspense fallback={null}>
        <NewAssignmentFromUrl closeHref="/dashboard" roster={ROSTER} />
      </Suspense>
    </div>
  );
}
