import { auth } from '@clerk/nextjs/server';
import { canEditAssignment, canViewAssignment, getAssignment, loadAssignmentViewer } from '../../../lib/assignments';
import type { Assignment } from '../../types/assignments.types';

export type AssignmentView = {
  assignment: Assignment;
  /** true for editors from the organization that posted it */
  canEdit: boolean;
};

/** One assignment for the signed-in person's assignment drawer, or null when it does not exist or they may not see it */
export async function loadAssignmentView(id: string | undefined): Promise<AssignmentView | null> {
  if (!id) return null;

  const { userId } = await auth();
  const [viewer, assignment] = await Promise.all([userId ? loadAssignmentViewer(userId) : null, getAssignment(id)]);

  if (!assignment || !canViewAssignment(viewer, assignment)) return null;
  return { assignment, canEdit: canEditAssignment(viewer, assignment) };
}
