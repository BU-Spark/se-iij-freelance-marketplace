import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import { ASSIGNMENTS } from '../constants';
import type { DeskAssignment } from '../../types/dashboard.types';
import FreelancerDashboard from './FreelancerDashboard';
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

export default function FreelancerPage() {
  return (
    <FreelancerWorkspace>
      <main className={styles.main}>
        <p className={styles.eyebrow}>Freelancer workspace</p>
        <h1>Your assignment desk</h1>
        <p>Discover opportunities and keep your current work in view.</p>
        <FreelancerDashboard assignments={DEMO_ASSIGNMENTS} freelancerId={DEMO_FREELANCER_ID} />
      </main>
    </FreelancerWorkspace>
  );
}
