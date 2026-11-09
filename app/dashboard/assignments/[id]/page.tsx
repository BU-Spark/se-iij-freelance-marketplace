import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { Header } from '../../../components/header/Header';
import { canViewAssignment, getAssignment, loadAssignmentViewer } from '../../../../lib/assignments';
import AssignmentDetail from './AssignmentDetail';
import styles from '../assignments.module.css';

export const dynamic = 'force-dynamic';

type AssignmentPageProps = { params: Promise<{ id: string }> };

/** The expanded view of one assignment */
export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params;
  const { userId } = await auth();

  const [viewer, assignment] = await Promise.all([userId ? loadAssignmentViewer(userId) : null, getAssignment(id)]);

  if (!assignment || !canViewAssignment(viewer, assignment)) notFound();

  return (
    <div className={styles.shell}>
      <Header />
      <AssignmentDetail assignment={assignment} />
    </div>
  );
}
