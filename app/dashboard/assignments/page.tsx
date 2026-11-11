import { auth } from '@clerk/nextjs/server';
import type { Assignment } from '../../types/assignments.types';
import { listOpenAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import { requireWorkspace } from '../../../lib/workspace';
import AssignmentDrawer from '../../components/AssignmentDrawer/AssignmentDrawer';
import AssignmentsBrowser from './AssignmentsBrowser';
import { loadAssignmentView, type AssignmentView } from './loadAssignmentView';
import styles from './assignments.module.css';

// Read fresh rows on every request instead of baking a snapshot into the build
export const dynamic = 'force-dynamic';

type AssignmentsPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
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

  // Clicking an assignment opens it in a drawer at ?assignment=<id>
  const openId = (await searchParams)?.assignment;
  let opened: AssignmentView | null = null;
  try {
    opened = await loadAssignmentView(typeof openId === 'string' ? openId : undefined);
  } catch (error) {
    console.error('Failed to load the assignment for the drawer.', error);
  }

  return (
    <>
      <div className={styles.shell}>
        <AssignmentsBrowser assignments={assignments} loadFailed={loadFailed} />
      </div>
      {opened && (
        <AssignmentDrawer assignment={opened.assignment} canEdit={opened.canEdit} closeHref="/dashboard/assignments" />
      )}
    </>
  );
}
