import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { loadAssignmentViewer } from '../../../../lib/assignments';
import { assignmentDrawerHref } from '../../../utils/dashboard.utils';

export const dynamic = 'force-dynamic';

type AssignmentPageProps = { params: Promise<{ id: string }> };

/**
 * Old links to one assignment open it in the assignment drawer instead.
 * Anyone with the editor role (including people who are also freelancers) lands on the editor desk;
 * everyone else lands on the freelancer dashboard.
 */
export default async function AssignmentPage({ params }: AssignmentPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  const viewer = userId ? await loadAssignmentViewer(userId).catch(() => null) : null;

  const basePath = viewer?.roles.includes('editor') ? '/dashboard' : '/dashboard/freelancer';
  redirect(assignmentDrawerHref(basePath, id));
}
