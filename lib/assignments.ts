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
  created_at: Date;
  updated_at: Date;
};

const ASSIGNMENT_COLUMNS = `
  id, organization_id, created_by_user_id, title, description, category, slug,
  contact, location, length, deadline, compensation, status, created_at, updated_at
`;

/** Who is looking at assignments, as far as visibility and editing are concerned */
export type AssignmentViewer = {
  userId: string;
  roles: string[];
  /** The editor's organization; null for freelancers and editors without one yet */
  organizationId: string | null;
};

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
