import { redirect } from 'next/navigation';

/** Keep older onboarding links and bookmarks working after consolidating discovery. */
export default function AssignmentsPage() {
  redirect('/dashboard/freelancer');
}
