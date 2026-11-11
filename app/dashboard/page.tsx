import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { EditorHeader } from '../components/header/EditorHeader';
import AvailabilityColumn from './components/AvailabilityColumn';
import AssignmentsColumn from './components/AssignmentsColumn';
import PageSearch from './components/PageSearch';
import styles from './dashboard.module.css';
import { ROSTER } from './constants';
import { NewAssignmentFromUrl } from '../components';
import type { Assignment } from '../types/assignments.types';
import type { RosterMember } from '../types/dashboard.types';
import { listOpenAssignments, loadAssignmentViewer } from '../../lib/assignments';
import { loadEditorRoster } from '../../lib/roster';
import { requireWorkspace } from '../../lib/workspace';
import { countByStatus, formatDeskDate, toDeskAssignment } from '../utils/dashboard.utils';
import AssignmentDrawer from '../components/AssignmentDrawer/AssignmentDrawer';
import { loadAssignmentView, type AssignmentView } from './assignments/loadAssignmentView';

/*
 * Dashboard: availability (day / week / month) on the left,
 * assignments (All / Open / Invited / Assigned) on the right.
 * The New Assignment drawer opens when the URL has ?new=assignment,
 * and clicking an assignment opens it in a drawer at ?assignment=<id>.
 */

// New posts have to appear as soon as the drawer sends the editor back here
export const dynamic = 'force-dynamic';

type DashboardProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function Dashboard({ searchParams }: DashboardProps) {
  // The editor desk is only for people with the editor role
  await requireWorkspace('editor');

  let posted: Assignment[] = [];
  try {
    // Only the assignments the editor's own organization posted
    const { userId } = await auth();
    const viewer = userId ? await loadAssignmentViewer(userId) : null;
    posted = await listOpenAssignments(viewer);
  } catch (error) {
    console.error('Failed to load assignments.', error);
  }

  // The availability column is this editor's own roster, not the whole directory
  let roster: RosterMember[] = [];
  let rosterFailed = false;
  try {
    const { userId } = await auth();
    if (userId) {
      const { members } = await loadEditorRoster(userId);
      roster = members;
    }
  } catch (error) {
    console.error('Failed to load the roster for the desk.', error);
    rosterFailed = true;
  }

  // The assignment drawer, when a card was clicked
  const openId = (await searchParams)?.assignment;
  let opened: AssignmentView | null = null;
  try {
    opened = await loadAssignmentView(typeof openId === 'string' ? openId : undefined);
  } catch (error) {
    console.error('Failed to load the assignment for the drawer.', error);
  }

  // Everything in the desk comes from the database: no sample cards sit under the real posts
  const assignments = posted.map(toDeskAssignment);
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
        <AvailabilityColumn roster={roster} loadFailed={rosterFailed} />

        {/* ---- Right column: assignments ---- */}
        <AssignmentsColumn assignments={assignments} roster={ROSTER} />
      </main>

      {/* reads ?new=assignment from the URL; Suspense is required by useSearchParams */}
      <Suspense fallback={null}>
        <NewAssignmentFromUrl closeHref="/dashboard" roster={ROSTER} />
      </Suspense>

      {opened && <AssignmentDrawer assignment={opened.assignment} canEdit={opened.canEdit} closeHref="/dashboard" />}
    </div>
  );
}
