'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import styles from './admin.module.css';

export const ADMIN_TABS = [
  { label: 'Inbox', href: '/admin' },
  { label: 'Verification', href: '/admin/verification' },
  { label: 'Accounts', href: '/admin/accounts' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className={styles.tabs}>
      {ADMIN_TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(styles.tab, active && styles.tabActive)}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
