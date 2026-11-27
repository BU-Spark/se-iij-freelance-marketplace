import { db } from './db';
import type { Applicant } from '../app/types/dashboard.types';
import type { AssignmentResponse, AssignmentResponses } from '../app/types/assignments.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

/** Every application the signed-in freelancer has made, keyed by assignment id */
export async function listAssignmentResponses(freelancerUserId: string): Promise<AssignmentResponses> {
  if (!UUID_PATTERN.test(freelancerUserId)) return {};

  const { rows } = await db.query<{ assignment_id: string; created_at: string | Date }>(
    `SELECT assignment_id, created_at
       FROM assignment_responses
      WHERE freelancer_user_id = $1`,
    [freelancerUserId]
  );

  return Object.fromEntries(
    rows.map((row) => [row.assignment_id, { kind: 'interested', at: isoString(row.created_at) }])
  );
}

/**
 * Applies the freelancer to the assignment. The insert only matches an assignment that is still
 * open, so a closed or missing post answers null; applying again keeps the same row.
 */
export async function applyToAssignment(
  assignmentId: string,
  freelancerUserId: string
): Promise<AssignmentResponse | null> {
  if (!UUID_PATTERN.test(assignmentId) || !UUID_PATTERN.test(freelancerUserId)) return null;

  const { rows } = await db.query<{ updated_at: string | Date }>(
    `INSERT INTO assignment_responses (assignment_id, freelancer_user_id)
     SELECT a.id, $2
       FROM assignments a
      WHERE a.id = $1 AND a.status = 'open'
     ON CONFLICT (assignment_id, freelancer_user_id)
     DO UPDATE SET updated_at = NOW()
     RETURNING updated_at`,
    [assignmentId, freelancerUserId]
  );

  return rows[0] ? { kind: 'interested', at: isoString(rows[0].updated_at) } : null;
}

/** Takes back an application; false when there was nothing stored (or the ids are not UUIDs) */
export async function withdrawApplication(assignmentId: string, freelancerUserId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(assignmentId) || !UUID_PATTERN.test(freelancerUserId)) return false;

  const result = await db.query(
    'DELETE FROM assignment_responses WHERE assignment_id = $1 AND freelancer_user_id = $2',
    [assignmentId, freelancerUserId]
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Everyone who applied to any of these assignments, grouped by assignment id and in the order
 * they applied. The desk needs names and cities even when the applicant is not on the editor's
 * roster, so the profile is joined in rather than looked up from the roster.
 */
export async function listApplicantsFor(assignmentIds: string[]): Promise<Record<string, Applicant[]>> {
  const ids = assignmentIds.filter((id) => UUID_PATTERN.test(id));
  if (ids.length === 0) return {};

  const { rows } = await db.query<{ assignment_id: string; id: string; name: string; city: string | null }>(
    `SELECT r.assignment_id,
            u.id,
            TRIM(u.first_name || ' ' || u.last_name) AS name,
            f.location AS city
       FROM assignment_responses r
       JOIN users u ON u.id = r.freelancer_user_id
       LEFT JOIN freelancers f ON f.user_id = u.id
      WHERE r.assignment_id = ANY($1::uuid[])
      ORDER BY r.created_at`,
    [ids]
  );

  const byAssignment: Record<string, Applicant[]> = {};
  for (const row of rows) {
    (byAssignment[row.assignment_id] ??= []).push({ id: row.id, name: row.name, city: row.city ?? '' });
  }
  return byAssignment;
}
