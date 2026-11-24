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
  /** the editor who posted it, resolved from `users` so the organization view can name them */
  created_by_name: string | null;
  created_at: Date;
  updated_at: Date;
};

const ASSIGNMENT_COLUMNS = `
  id, organization_id, created_by_user_id, title, description, category, slug,
  contact, location, length, deadline, compensation, status, assigned_to_user_id, created_at, updated_at,
  (SELECT TRIM(u.first_name || ' ' || u.last_name)
     FROM users u
    WHERE u.id = assignments.created_by_user_id) AS created_by_name
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
    createdByName: row.created_by_name ?? undefined,
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

/** Which slice of the desk a query reads: your own posts, or everything the organization posted */
export type AssignmentScope = 'desk' | 'organization';

/**
 * The WHERE clause that decides which assignments a viewer may see. The desk is personal: an
 * editor only sees posts they wrote, and their colleagues' posts are on the organization page.
 */
function viewerScope(
  viewer: AssignmentViewer | null | undefined,
  scope: AssignmentScope
): { clause: string; params: unknown[] } {
  if (!isEditor(viewer)) return { clause: `status = 'open'`, params: [] };
  if (scope === 'organization' && viewer.organizationId) {
    return { clause: 'organization_id = $1', params: [viewer.organizationId] };
  }
  return { clause: 'created_by_user_id = $1', params: [viewer.userId] };
}

/**
 * The desk's assignments, a page at a time, newest first. The cursor is the last id on the page:
 * `(created_at, id)` makes the sort stable even when two posts share a timestamp.
 * `scope: 'organization'` widens this to every post the viewer's organization made.
 */
export async function listDeskAssignments(
  viewer: AssignmentViewer | null | undefined,
  {
    limit = DESK_PAGE_SIZE,
    after = null,
    scope = 'desk',
  }: { limit?: number; after?: string | null; scope?: AssignmentScope } = {}
): Promise<AssignmentPage> {
  const filter = viewerScope(viewer, scope);
  const params = [...filter.params];
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
      WHERE ${filter.clause} ${cursorClause}
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
  viewer: AssignmentViewer | null | undefined,
  scope: AssignmentScope = 'desk'
): Promise<Record<AssignmentStatus, number>> {
  const filter = viewerScope(viewer, scope);
  const { rows } = await db.query<{ status: AssignmentStatus; total: string }>(
    `SELECT status, COUNT(*)::text AS total
       FROM assignments
      WHERE ${filter.clause}
      GROUP BY status`,
    filter.params
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
 * True when the assignment is on the editor's desk: their own post, or a post their organization
 * made. This decides what an editor may read, not what they may change.
 * A post made by an organization belongs to that organization only, so an editor who moves
 * to another desk loses sight of it; posts made before the editor joined an organization belong
 * to whoever wrote them.
 */
export function belongsToViewer(viewer: AssignmentViewer, assignment: Assignment): boolean {
  if (assignment.organizationId) return viewer.organizationId === assignment.organizationId;
  return assignment.createdByUserId === viewer.userId;
}

/**
 * True when this editor wrote the post. An organization post also has to be written while they
 * were in that organization, so an editor who moves desks loses the right to change it; a post
 * made before they joined an organization stays theirs.
 */
export function authoredByViewer(viewer: AssignmentViewer, assignment: Assignment): boolean {
  if (assignment.createdByUserId !== viewer.userId) return false;
  if (assignment.organizationId) return viewer.organizationId === assignment.organizationId;
  return true;
}

/**
 * Only the editor who posted the assignment may edit, delete or assign it. Colleagues in the same
 * organization can read it on the organization page, and freelancers can read it while it is open,
 * but neither may change someone else's post.
 */
export function canEditAssignment(viewer: AssignmentViewer | null | undefined, assignment: Assignment): boolean {
  return isEditor(viewer) && authoredByViewer(viewer, assignment);
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
