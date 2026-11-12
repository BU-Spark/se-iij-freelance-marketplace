'use client';

import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import IIJLogo from '../components/IIJLogo/IIJLogo';
import menu from '../components/NavMenu/NavMenu.module.css';
import styles from './admin.module.css';

/** The admin sections, shared by the sidebar, the phone menu and the page heading */
export const ADMIN_TABS = [
  { label: 'Inbox', href: '/admin', description: 'Appeals and flags waiting on the team, newest first.' },
  { label: 'Verification', href: '/admin/verification', description: 'Check who people say they are.' },
  { label: 'Accounts', href: '/admin/accounts', description: 'Find people and suspend or reactivate them.' },
];

const useCurrentTab = () => {
  const pathname = usePathname();
  return ADMIN_TABS.find((tab) => tab.href === pathname) ?? ADMIN_TABS[0];
};

/** Logo and name, linking to the inbox */
export function AdminBrand() {
  return (
    <Link href="/admin" className={styles.brandLink}>
      <IIJLogo size={34} animated={false} showText={false} />
      <span>
        Story Match <span className={styles.brandTag}>Admin</span>
      </span>
    </Link>
  );
}

/** The list of sections, styled like the app's main menu */
export function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const current = useCurrentTab();

  return (
    <nav aria-label="Admin sections">
      <ul className={menu.list}>
        {ADMIN_TABS.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab === current ? 'page' : undefined}
              className={tab === current ? `${menu.item} ${menu.current}` : menu.item}
              onClick={onNavigate}
            >
              <span className={menu.dot} aria-hidden="true" />
              <span className={menu.itemLabel}>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Ends the admin's session and returns them to the home page */
export function AdminSignOut() {
  const { signOut } = useClerk();

  return (
    <button type="button" className={styles.signOut} onClick={() => signOut({ redirectUrl: '/' })}>
      Sign out
    </button>
  );
}

/** The current section's title and what it is for */
export function AdminHeading() {
  const current = useCurrentTab();

  return (
    <>
      <p className={styles.eyebrow}>Story Match team</p>
      <h1 className={styles.title}>{current.label}</h1>
      <p className={styles.description}>{current.description}</p>
    </>
  );
}
