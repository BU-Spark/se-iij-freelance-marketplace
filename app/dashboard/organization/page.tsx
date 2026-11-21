import { auth } from '@clerk/nextjs/server';
import AssignmentDrawer from '../../components/AssignmentDrawer/AssignmentDrawer';
import { countAssignmentsByStatus, listDeskAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import { listOrganizationTeam, type OrganizationMember } from '../../../lib/organization';
import { requireWorkspace } from '../../../lib/workspace';
import type { AssignmentStatus } from '../../types/dashboard.types';
import { toDeskAssignment } from '../../utils/dashboard.utils';
import { organizationName } from '../../utils/organization.utils';
import { loadAssignmentView, type AssignmentView } from '../assignments/loadAssignmentView';
import AssignmentsTable from '../components/AssignmentsTable';
import OrganizationTeam from './OrganizationTeam';
import styles from './organization.module.css';

/*
 * The organization view: who works here, and every post this organization has on the go
 * (open, pending and assigned), rather than only the open ones the desk shows by default.
 */

export const dynamic = 'force-dynamic';

type OrganizationPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

const STATS: { key: AssignmentStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'invited', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
];

export default async function OrganizationPage({ searchParams }: OrganizationPageProps) {
  // The organization view belongs to the editor side of the desk
  await requireWorkspace('editor');

  const { userId } = await auth();
  const viewer = userId ? await loadAssignmentViewer(userId) : null;
  const organizationId = viewer?.organizationId ?? null;

  let team: OrganizationMember[] = [];
  let counts: Record<AssignmentStatus, number> = { open: 0, invited: 0, assigned: 0 };
  let posts: Awaited<ReturnType<typeof listDeskAssignments>>['items'] = [];

  if (organizationId) {
    try {
      const [page, statusCounts, members] = await Promise.all([
        listDeskAssignments(viewer, { scope: 'organization' }),
        countAssignmentsByStatus(viewer, 'organization'),
        listOrganizationTeam(organizationId),
      ]);
      posts = page.items;
      counts = statusCounts;
      team = members;
    } catch (error) {
      console.error('Failed to load the organization view.', error);
    }
  }

  // The assignment drawer, when a row was clicked on this page
  const openId = (await searchParams)?.assignment;
  let opened: AssignmentView | null = null;
  try {
    opened = await loadAssignmentView(typeof openId === 'string' ? openId : undefined);
  } catch (error) {
    console.error('Failed to load the assignment for the drawer.', error);
  }

  // Rows link back to this page, so the drawer opens over the organization view
  const assignments = posts.map((post) => ({
    ...toDeskAssignment(post),
    href: `/dashboard/organization?assignment=${post.id}`,
  }));

  const name = organizationName(organizationId);
  const total = counts.open + counts.invited + counts.assigned;

  return (
    <main className={styles.main}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Your organization</p>
        <h1>{name ?? 'No organization yet'}</h1>
        <p>
          {organizationId
            ? 'Everyone on this desk, and every post this organization has open, pending or assigned.'
            : 'Your account is not tied to an organization, so your posts live on your own desk only.'}
        </p>
      </header>

      {!organizationId ? (
        <p className={styles.notice}>
          Ask an admin to set your organization, or keep working from the desk — nothing is missing here.
        </p>
      ) : (
        <>
          <ul className={styles.stats} aria-label="Organization at a glance">
            {STATS.map((stat) => (
              <li key={stat.key} className={styles.stat}>
                <span className={styles.statValue}>{counts[stat.key]}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </li>
            ))}
            <li className={styles.stat}>
              <span className={styles.statValue}>{team.length}</span>
              <span className={styles.statLabel}>{team.length === 1 ? 'Person' : 'People'}</span>
            </li>
          </ul>

          <div className={styles.columns}>
            <section aria-labelledby="org-assignments">
              <div className={styles.sectionHead}>
                <h2 id="org-assignments">Assignments</h2>
                <p>
                  {total === 1 ? '1 post' : `${total} posts`} across every status. Only the ones you posted show on{' '}
                  <a href="/dashboard">your desk</a>.
                </p>
              </div>

              {assignments.length === 0 ? (
                <p className={styles.empty}>This organization has not posted an assignment yet.</p>
              ) : (
                <AssignmentsTable assignments={assignments} showCreator />
              )}
            </section>

            <section aria-labelledby="org-team">
              <div className={styles.sectionHead}>
                <h2 id="org-team">Team</h2>
                <p>Editors whose profile sits under {name}.</p>
              </div>

              {team.length === 0 ? (
                <p className={styles.empty}>Nobody else is listed under this organization yet.</p>
              ) : (
                <OrganizationTeam members={team} />
              )}
            </section>
          </div>
        </>
      )}

      {opened && (
        <AssignmentDrawer
          assignment={opened.assignment}
          canEdit={opened.canEdit}
          canReport={false}
          showOrganization
          closeHref="/dashboard/organization"
        />
      )}
    </main>
  );
}
