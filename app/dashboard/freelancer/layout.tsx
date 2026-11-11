import type { ReactNode } from 'react';
import { requireWorkspace } from '../../../lib/workspace';

/** The freelancer workspace is only for people whose profile has the freelancer role */
export default async function FreelancerLayout({ children }: { children: ReactNode }) {
  await requireWorkspace('freelancer');

  return children;
}
