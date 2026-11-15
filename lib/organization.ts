import { db } from './db';

/** One editor who works at an organization */
export type OrganizationMember = {
  id: string;
  name: string;
  jobTitle: string;
  location: string | null;
  /** the desks they look after, e.g. ["Politics", "Climate"] */
  desks: string[];
};

type OrganizationMemberRow = {
  id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  location: string | null;
  desks: string[] | null;
};

/**
 * Everyone whose editor row points at this organization. Organizations are still just a TEXT id
 * on `editors`, so this is the only place the team exists.
 */
export async function listOrganizationTeam(organizationId: string): Promise<OrganizationMember[]> {
  const { rows } = await db.query<OrganizationMemberRow>(
    `SELECT u.id, u.first_name, u.last_name, e.job_title, e.location, e.desks
       FROM users u
       JOIN editors e ON e.user_id = u.id
      WHERE e.organization_id = $1
      ORDER BY u.first_name, u.last_name`,
    [organizationId]
  );

  return rows.map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim() || 'Unnamed editor',
    jobTitle: row.job_title,
    location: row.location,
    desks: row.desks ?? [],
  }));
}
