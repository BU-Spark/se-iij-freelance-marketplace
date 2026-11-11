import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { EditorHeader } from '../../../components/header/EditorHeader';
import { canEditAssignment, canViewAssignment, getAssignment, loadAssignmentViewer } from '../../../../lib/assignments';
import { ASSIGNMENTS } from '../../constants';
import { sampleToAssignment } from '../../../utils/dashboard.utils';
import AssignmentDetail from './AssignmentDetail';
import styles from '../assignments.module.css';

export const dynamic = 'force-dynamic';

type AssignmentPageProps = { params: Promise<{ id: string }> };

/** The expanded view of one assignment; editors from the posting organization can edit it here */
export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  const [viewer, assignment] = await Promise.all([userId ? loadAssignmentViewer(userId) : null, getAssignment(id)]);
  const role =
    viewer && !viewer.roles.includes('editor') && viewer.roles.includes('freelancer') ? 'freelancer' : 'editor';

  // Sample desk cards are not in the database; show them read-only so they can be opened too
  if (!assignment) {
    const sample = ASSIGNMENTS.find((a) => a.id === id);
    if (!sample) notFound();
    return (
      <div className={styles.shell}>
        <EditorHeader initialRole={role} />
        <AssignmentDetail assignment={sampleToAssignment(sample)} canEdit={false} isSample />
      </div>
    );
  }

  if (!canViewAssignment(viewer, assignment)) notFound();

  return (
    <div className={styles.shell}>
      <EditorHeader initialRole={role} />
      <AssignmentDetail assignment={assignment} canEdit={canEditAssignment(viewer, assignment)} />
    </div>
  );
}
