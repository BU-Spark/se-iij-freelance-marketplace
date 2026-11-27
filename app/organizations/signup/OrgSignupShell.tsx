import Link from 'next/link';
import type { ReactNode } from 'react';
import { IIJLogo } from '../../components';
import auth from '../../login/login.module.css';
import styles from './organizationSignup.module.css';

type OrgSignupShellProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

/** The frame both signup steps share: logo, step label, heading and the page's own form */
export default function OrgSignupShell({ eyebrow, title, intro, children }: OrgSignupShellProps) {
  return (
    <main className={auth.main}>
      <div className={auth.colorBand} aria-hidden="true" />
      <section className={`${auth.panel} ${styles.panel}`} aria-labelledby="org-signup-title">
        <Link href="/" className={auth.brand} aria-label="StoryMatch home">
          <IIJLogo size={92} />
        </Link>
        <p className={auth.eyebrow}>{eyebrow}</p>
        <h1 id="org-signup-title">{title}</h1>
        {intro && <p className={auth.intro}>{intro}</p>}
        {children}
      </section>
    </main>
  );
}
