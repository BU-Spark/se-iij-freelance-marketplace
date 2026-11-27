import type { ReactNode } from 'react';
import { requireWorkspace } from '../../../lib/workspace';
import LiveUpdates from './components/LiveUpdates';

/**
 * The freelancer workspace is only for people whose profile has the freelancer role.
 * It uses the same type as the editor side: the app's sans for text, its serif for headings.
 */
export default async function FreelancerLayout({ children }: { children: ReactNode }) {
  await requireWorkspace('freelancer');

  return (
    <>
      {children}
      {/* keeps every freelancer page in step with what editors change on their desk */}
      <LiveUpdates />
    </>
  );
}
