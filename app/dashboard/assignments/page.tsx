import { auth } from '@clerk/nextjs/server';
import type { Assignment } from '../../types/assignments.types';
import { listOpenAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import { requireWorkspace } from '../../../lib/workspace';
import AssignmentsBrowser from './AssignmentsBrowser';
import styles from './assignments.module.css';

// Read fresh rows on every request instead of baking a snapshot into the build
export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  // Browsing open assignments is the freelancer side of the app
  await requireWorkspace('freelancer');

  let assignments: Assignment[] = [];
  let loadFailed = false;

  try {
    // Editors only see their own organization's assignments; freelancers see every open one
    const { userId } = await auth();
    const viewer = userId ? await loadAssignmentViewer(userId) : null;
    assignments = await listOpenAssignments(viewer);
  } catch (error) {
    console.error('Failed to load assignments.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <AssignmentsBrowser assignments={assignments} loadFailed={loadFailed} />
    </div>
  );
}
