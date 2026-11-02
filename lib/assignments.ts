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

const SELECT_OPEN_ASSIGNMENTS = `
  SELECT id, organization_id, created_by_user_id, title, description, category, slug,
         contact, location, length, deadline, compensation, status, created_at, updated_at
    FROM assignments
   WHERE status = 'open'
   ORDER BY created_at DESC
`;

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

/** Every assignment still open to freelancers, newest first */
export async function listOpenAssignments(): Promise<Assignment[]> {
  const { rows } = await db.query<AssignmentRow>(SELECT_OPEN_ASSIGNMENTS);
  return rows.map(toAssignment);
}
