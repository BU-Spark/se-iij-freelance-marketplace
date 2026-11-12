import { auth } from '@clerk/nextjs/server';
import Avatar from '../../components/Avatar/Avatar';
import { countAssignmentsByStatus, loadAssignmentViewer } from '../../../lib/assignments';
import { listOrganizationTeam, type OrganizationMember } from '../../../lib/organization';
import { requireWorkspace } from '../../../lib/workspace';
import type { AssignmentStatus } from '../../types/dashboard.types';
import { organizationName } from '../../utils/organization.utils';
import styles from './organization.module.css';

/*
 * The organization view: who works here, and how much this organization has on the go.
 * Organizations are still a TEXT id on `editors`, so everything here is scoped to the viewer's own.
 */

export const dynamic = 'force-dynamic';

const STATS: { key: AssignmentStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'invited', label: 'Pending' },
  { key: 'assigned', label: 'Assigned' },
];

export default async function OrganizationPage() {
  // The organization view belongs to the editor side of the desk
  await requireWorkspace('editor');

  const { userId } = await auth();
  const viewer = userId ? await loadAssignmentViewer(userId) : null;
  const organizationId = viewer?.organizationId ?? null;

  let team: OrganizationMember[] = [];
  let counts: Record<AssignmentStatus, number> = { open: 0, invited: 0, assigned: 0 };

  if (organizationId) {
    try {
      const [statusCounts, members] = await Promise.all([
        countAssignmentsByStatus(viewer),
        listOrganizationTeam(organizationId),
      ]);
      counts = statusCounts;
      team = members;
    } catch (error) {
      console.error('Failed to load the organization view.', error);
    }
  }

  const name = organizationName(organizationId);

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

          <section aria-labelledby="org-team">
            <div className={styles.sectionHead}>
              <h2 id="org-team">Team</h2>
              <p>Editors whose profile sits under {name}.</p>
            </div>

            {team.length === 0 ? (
              <p className={styles.empty}>Nobody else is listed under this organization yet.</p>
            ) : (
              <ul className={styles.team}>
                {team.map((member) => (
                  <li key={member.id} className={styles.person}>
                    <Avatar name={member.name} size={40} />
                    <div>
                      <p className={styles.personName}>{member.name}</p>
                      <p className={styles.personMeta}>
                        {[member.jobTitle, member.location].filter(Boolean).join(' · ')}
                      </p>
                      {member.desks.length > 0 && <p className={styles.desks}>{member.desks.join(', ')}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
