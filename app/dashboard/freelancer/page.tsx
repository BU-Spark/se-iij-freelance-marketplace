import { auth } from '@clerk/nextjs/server';
import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import Link from 'next/link';
import { listInvitesForFreelancer, type RosterInvite } from '../../../lib/roster';
import { ASSIGNMENTS } from '../constants';
import type { DeskAssignment } from '../../types/dashboard.types';
import FreelancerDashboard from './FreelancerDashboard';
import RosterInvites from './RosterInvites';
import styles from './freelancer.module.css';

// Demo ownership is explicit until the API supplies assignments for the authenticated user.
const DEMO_FREELANCER_ID = 'priya';
const DEMO_DEADLINE = ASSIGNMENTS[1].deadline ?? new Date();
const DEMO_ASSIGNMENTS: DeskAssignment[] = [
  ...ASSIGNMENTS,
  ...['Community health reporting', 'Climate data explainer', 'Local arts interview', 'Housing policy fact-check'].map(
    (title, index) => ({
      ...ASSIGNMENTS[1],
      id: `demo-opportunity-${index}`,
      title,
      deadline: new Date(DEMO_DEADLINE.getTime() + (index + 1) * 86400000),
      interestedIds: [],
      invitedIds: [],
    })
  ),
  {
    ...ASSIGNMENTS[2],
    id: 'demo-personal-invitation',
    title: 'Invitation: City budget data analysis',
    invitedIds: [DEMO_FREELANCER_ID],
  },
];

// An invitation sent a moment ago has to show up on the next visit
export const dynamic = 'force-dynamic';

export default async function FreelancerPage() {
  let invites: RosterInvite[] = [];

  try {
    const { userId } = await auth();
    if (userId) invites = await listInvitesForFreelancer(userId);
  } catch (error) {
    console.error('Failed to load roster invitations.', error);
  }

  return (
    <FreelancerWorkspace>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Freelancer workspace</p>
        <h1>Your assignment desk</h1>
        <p>Discover opportunities and keep your current work in view.</p>
        <p>
          <Link href="/dashboard/freelancer/pitches">View my pitches</Link>
        </p>
        {/* declined invitations are left out: the editor sees the answer on their roster */}
        <RosterInvites invites={invites.filter((invite) => invite.status !== 'declined')} />
        <FreelancerDashboard assignments={DEMO_ASSIGNMENTS} freelancerId={DEMO_FREELANCER_ID} />
      </main>
    </FreelancerWorkspace>
  );
}
