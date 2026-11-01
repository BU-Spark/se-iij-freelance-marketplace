import Link from 'next/link';
import type { ReactNode } from 'react';
import ProfileButton from '../Profile/ProfileButton';
export type FreelancerWorkspaceProps = { children: ReactNode };
export function FreelancerWorkspace({ children }: FreelancerWorkspaceProps) {
  return (
    <>
      <header aria-label="Freelancer workspace">
        <nav aria-label="Freelancer navigation">
          <Link href="/dashboard/freelancer">Freelancer dashboard</Link> <Link href="/dashboard">Editor desk</Link>
        </nav>
        <ProfileButton />
      </header>
      {children}
    </>
  );
}
