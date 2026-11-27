import Link from 'next/link';
import type { ReactNode } from 'react';
import { IIJLogo } from '../../components';

type OrgSignupShellProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

/** The frame both signup steps share: logo, step label, heading and the page's own form */
export default function OrgSignupShell({ eyebrow, title, intro, children }: OrgSignupShellProps) {
  return (
    <main>
      <section aria-labelledby="org-signup-title">
        <Link href="/" aria-label="StoryMatch home">
          <IIJLogo size={92} />
        </Link>
        <p>{eyebrow}</p>
        <h1 id="org-signup-title">{title}</h1>
        {intro && <p>{intro}</p>}
        {children}
      </section>
    </main>
  );
}
