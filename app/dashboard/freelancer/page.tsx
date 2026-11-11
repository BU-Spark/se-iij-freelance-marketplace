import { auth } from '@clerk/nextjs/server';
import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import { listInvitesForFreelancer, type RosterInvite } from '../../../lib/roster';
import { listOpenAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import type { DeskAssignment } from '../../types/dashboard.types';
import { toDeskAssignment } from '../../utils/dashboard.utils';
import FreelancerDashboard from './FreelancerDashboard';
import RosterInvites from './RosterInvites';
import styles from './freelancer.module.css';

// An invitation sent a moment ago has to show up on the next visit
export const dynamic = 'force-dynamic';

export default async function FreelancerPage() {
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

  return (
    <FreelancerWorkspace>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Freelancer workspace</p>
        <h1>Your assignment desk</h1>
        <p>Discover opportunities and keep your current work in view.</p>
        {/* declined invitations are left out: the editor sees the answer on their roster */}
        <RosterInvites invites={invites.filter((invite) => invite.status !== 'declined')} />
        <FreelancerDashboard assignments={assignments} freelancerId={freelancerId} />
      </main>
    </FreelancerWorkspace>
  );
}
