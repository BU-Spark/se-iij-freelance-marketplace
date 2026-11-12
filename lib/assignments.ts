import { db } from './db';
import type { Assignment } from '../app/types/assignments.types';
import type { AssignmentStatus } from '../app/types/dashboard.types';

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

/** One page of the desk's assignments, newest first */
export type AssignmentPage = {
  items: Assignment[];
  /** pass back as `after` for the next page; null when this was the last one */
  nextCursor: string | null;
};

/** How many assignments the desk loads at a time */
export const DESK_PAGE_SIZE = 20;

/** The WHERE clause that decides which assignments a viewer may see */
function viewerScope(viewer: AssignmentViewer | null | undefined): { clause: string; params: unknown[] } {
  if (!isEditor(viewer)) return { clause: `status = 'open'`, params: [] };
  if (viewer.organizationId) return { clause: 'organization_id = $1', params: [viewer.organizationId] };
  return { clause: 'organization_id IS NULL AND created_by_user_id = $1', params: [viewer.userId] };
}

/**
 * The desk's assignments, a page at a time, newest first. The cursor is the last id on the page:
 * `(created_at, id)` makes the sort stable even when two posts share a timestamp.
 */
export async function listDeskAssignments(
  viewer: AssignmentViewer | null | undefined,
  { limit = DESK_PAGE_SIZE, after = null }: { limit?: number; after?: string | null } = {}
): Promise<AssignmentPage> {
  const scope = viewerScope(viewer);
  const params = [...scope.params];
  let cursorClause = '';

  if (after) {
    // a stale or hand-edited cursor just means "start again from the top"
    if (!UUID_PATTERN.test(after)) return { items: [], nextCursor: null };
    params.push(after);
    cursorClause = `AND (created_at, id) < (SELECT created_at, id FROM assignments WHERE id = $${params.length})`;
  }

  params.push(limit + 1);

  const { rows } = await db.query<AssignmentRow>(
    `SELECT ${ASSIGNMENT_COLUMNS} FROM assignments
      WHERE ${scope.clause} ${cursorClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${params.length}`,
    params
  );

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map(toAssignment),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

/** Every assignment the viewer can see, counted by status — the status bar must not depend on a page */
export async function countAssignmentsByStatus(
  viewer: AssignmentViewer | null | undefined
): Promise<Record<AssignmentStatus, number>> {
  const scope = viewerScope(viewer);
  const { rows } = await db.query<{ status: AssignmentStatus; total: string }>(
    `SELECT status, COUNT(*)::text AS total
       FROM assignments
      WHERE ${scope.clause}
      GROUP BY status`,
    scope.params
  );

  const counts: Record<AssignmentStatus, number> = { open: 0, invited: 0, assigned: 0 };
  for (const row of rows) counts[row.status] = Number(row.total);
  return counts;
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
 * Deletes an assignment. Callers check `canEditAssignment` first; false here just means the row
 * was already gone (or the id was not a UUID).
 */
export async function deleteAssignment(assignmentId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(assignmentId)) return false;

  const result = await db.query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
  return (result.rowCount ?? 0) > 0;
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
