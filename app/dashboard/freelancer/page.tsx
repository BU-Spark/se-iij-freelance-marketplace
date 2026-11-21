import { auth } from '@clerk/nextjs/server';
import { listInvitesForFreelancer, type RosterInvite } from '../../../lib/roster';
import { listOpenAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import type { DeskAssignment } from '../../types/dashboard.types';
import { formatDeskDate, toDeskAssignment } from '../../utils/dashboard.utils';
import AssignmentDrawer from '../../components/AssignmentDrawer/AssignmentDrawer';
import { loadAssignmentView, type AssignmentView } from '../assignments/loadAssignmentView';
import FreelancerDashboard from './FreelancerDashboard';
import RosterInvites from './RosterInvites';
import styles from './freelancer.module.css';

// An invitation sent a moment ago has to show up on the next visit
export const dynamic = 'force-dynamic';

type FreelancerPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function FreelancerPage({ searchParams }: FreelancerPageProps) {
  const { userId } = await auth();

  let invites: RosterInvite[] = [];
  try {
    if (userId) invites = await listInvitesForFreelancer(userId);
  } catch (error) {
    console.error('Failed to load roster invitations.', error);
  }

  // The feed is the open assignments editors have actually posted, not a demo list
  let assignments: DeskAssignment[] = [];
  let freelancerId = '';
  try {
    const viewer = userId ? await loadAssignmentViewer(userId) : null;
    freelancerId = viewer?.userId ?? '';
    assignments = (await listOpenAssignments(viewer)).map(toDeskAssignment);
  } catch (error) {
    console.error('Failed to load assignments for the freelancer.', error);
  }

  // Clicking an assignment opens it in a drawer over the dashboard at ?assignment=<id>
  const openId = (await searchParams)?.assignment;
  let opened: AssignmentView | null = null;
  try {
    opened = await loadAssignmentView(typeof openId === 'string' ? openId : undefined);
  } catch (error) {
    console.error('Failed to load the assignment for the drawer.', error);
  }

  return (
    // Same frame as the editor desk: status bar under the header, then two columns (see FreelancerDashboard)
    <main className={styles.main}>
      {/* declined invitations are left out: the editor sees the answer on their roster */}
      <FreelancerDashboard assignments={assignments} freelancerId={freelancerId} dateLabel={formatDeskDate(new Date())}>
        <RosterInvites invites={invites.filter((invite) => invite.status !== 'declined')} />
      </FreelancerDashboard>
      {opened && (
        <AssignmentDrawer
          assignment={opened.assignment}
          canEdit={opened.canEdit}
          showOrganization
          closeHref="/dashboard/freelancer"
        />
      )}
    </main>
  );
}
