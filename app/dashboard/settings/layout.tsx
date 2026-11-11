'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import { useProfile } from '../../hooks/useProfile';
import type { ProfileRole } from '../../types/profile.types';
import styles from './settings.module.css';

/** Settings is split by topic; each one is its own page so nothing shares a scroll with anything else */
const SECTIONS = [
  { href: '/dashboard/settings', label: 'Profile' },
  { href: '/dashboard/settings/security', label: 'Sign-in & security' },
];

/**
 * The frame every settings page shares: the workspace header, the title, and the section links.
 * The pages themselves hold one topic each, so the profile page never carries the sign-in cards.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile } = useProfile();

  // the header offers the desk or the pitch button depending on which side this person works on
  const role: ProfileRole = profile?.roles.some((details) => details.role === 'editor') ? 'editor' : 'freelancer';

  return (
    <FreelancerWorkspace role={role}>
      <main className={styles.main}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>Your account</p>
          <h1>Settings</h1>
          <p>Your profile, availability and sign-in details — everything editors and freelancers see about you.</p>
        </header>

        <div className={styles.layout}>
          <nav className={styles.sectionNav} aria-label="Settings sections">
            {SECTIONS.map((section) => {
              const current = pathname === section.href;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={current ? `${styles.sectionLink} ${styles.sectionLinkActive}` : styles.sectionLink}
                  aria-current={current ? 'page' : undefined}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>

          <div className={styles.content}>{children}</div>
        </div>
      </main>
    </FreelancerWorkspace>
  );
}
