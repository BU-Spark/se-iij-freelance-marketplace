import { db } from './db';
import type { Assignment } from '../app/types/assignments.types';

/** A row from the `assignments` table, as `pg` returns it */
type AssignmentRow = {
  id: string;
  organization_id: string | null;
  created_by_user_id: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  contact: string;
  location: string;
  length: string;
  deadline: Date | null;
  compensation: string;
  status: Assignment['status'];
  assigned_to_user_id: string | null;
  created_at: Date;
  updated_at: Date;
};

const ASSIGNMENT_COLUMNS = `
  id, organization_id, created_by_user_id, title, description, category, slug,
  contact, location, length, deadline, compensation, status, assigned_to_user_id, created_at, updated_at
`;

/** Who is looking at assignments, as far as visibility and editing are concerned */
export type AssignmentViewer = {
  userId: string;
  roles: string[];
  /** The editor's organization; null for freelancers and editors without one yet */
  organizationId: string | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Turns a snake_case database row into the camelCase model the app uses */
export function toAssignment(row: AssignmentRow): Assignment {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByUserId: row.created_by_user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    slug: row.slug,
    contact: row.contact,
    location: row.location,
    length: row.length,
    deadline: row.deadline ? new Date(row.deadline) : null,
    compensation: row.compensation,
    status: row.status,
    assignedToUserId: row.assigned_to_user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** The signed-in person's id, roles and organization, or null before onboarding */
export async function loadAssignmentViewer(clerkId: string): Promise<AssignmentViewer | null> {
  const { rows } = await db.query<{ id: string; roles: string[] | null; organization_id: string | null }>(
    `SELECT u.id, u.roles, e.organization_id
       FROM users u
       LEFT JOIN editors e ON e.user_id = u.id
      WHERE u.clerk_id = $1`,
    [clerkId]
  );
  const row = rows[0];
  return row ? { userId: row.id, roles: row.roles ?? [], organizationId: row.organization_id } : null;
}

const isEditor = (viewer: AssignmentViewer | null | undefined): viewer is AssignmentViewer =>
  Boolean(viewer?.roles.includes('editor'));

/**
 * Open assignments, newest first.
 * Editors only see what their own organization posted (or, with no organization yet, their own posts).
 * Everyone else (freelancers browsing for work) sees every open assignment.
 */
export async function listOpenAssignments(viewer?: AssignmentViewer | null): Promise<Assignment[]> {
  if (isEditor(viewer)) {
    const { rows } = viewer.organizationId
      ? await db.query<AssignmentRow>(
          `SELECT ${ASSIGNMENT_COLUMNS} FROM assignments
            WHERE status = 'open' AND organization_id = $1
            ORDER BY created_at DESC`,
          [viewer.organizationId]
        )
      : await db.query<AssignmentRow>(
          `SELECT ${ASSIGNMENT_COLUMNS} FROM assignments
            WHERE status = 'open' AND organization_id IS NULL AND created_by_user_id = $1
            ORDER BY created_at DESC`,
          [viewer.userId]
        );
    return rows.map(toAssignment);
  }

  const { rows } = await db.query<AssignmentRow>(
    `SELECT ${ASSIGNMENT_COLUMNS} FROM assignments WHERE status = 'open' ORDER BY created_at DESC`
  );
  return rows.map(toAssignment);
}

/** One assignment by id, or null when it does not exist (or the id is not a UUID) */
export async function getAssignment(id: string): Promise<Assignment | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const { rows } = await db.query<AssignmentRow>(`SELECT ${ASSIGNMENT_COLUMNS} FROM assignments WHERE id = $1`, [id]);
  return rows[0] ? toAssignment(rows[0]) : null;
}

/**
 * True when the assignment belongs to the editor's desk.
 * A post made by an organization belongs to that organization only, so an editor who moves
 * to another desk loses the right to change it; posts made before the editor joined an
 * organization belong to whoever wrote them.
 */
export function belongsToViewer(viewer: AssignmentViewer, assignment: Assignment): boolean {
  if (assignment.organizationId) return viewer.organizationId === assignment.organizationId;
  return assignment.createdByUserId === viewer.userId;
}

/** Only editors from the organization that posted the assignment may edit it */
export function canEditAssignment(viewer: AssignmentViewer | null | undefined, assignment: Assignment): boolean {
  return isEditor(viewer) && belongsToViewer(viewer, assignment);
}

/** Editors see their organization's assignments; everyone else sees open ones */
export function canViewAssignment(viewer: AssignmentViewer | null | undefined, assignment: Assignment): boolean {
  if (isEditor(viewer)) return belongsToViewer(viewer, assignment);
  return assignment.status === 'open';
}

/**
 * Puts a freelancer on an assignment: the post moves to "assigned" and remembers who took it,
 * so a refresh (or the next editor) sees the same answer the desk showed.
 */
export async function assignFreelancer(assignmentId: string, freelancerUserId: string): Promise<Assignment | null> {
  if (!UUID_PATTERN.test(assignmentId) || !UUID_PATTERN.test(freelancerUserId)) return null;

  const { rows } = await db.query<AssignmentRow>(
    `UPDATE assignments
        SET status = 'assigned',
            assigned_to_user_id = $2,
            updated_at = NOW()
      WHERE id = $1
      RETURNING ${ASSIGNMENT_COLUMNS}`,
    [assignmentId, freelancerUserId]
  );

  return rows[0] ? toAssignment(rows[0]) : null;
}
