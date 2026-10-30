'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { OnboardingRole } from '../../types/onboarding.types';
import IIJLogo from '../IIJLogo/IIJLogo';
import { SearchBox } from '../search/SearchBox';
import { NAV_ITEMS, ROLE_OPTIONS } from './constants';
import styles from './header.module.css';

function isNavItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const [role, setRole] = useState<OnboardingRole>('editor');
  const pathname = usePathname();

  return (
    <header className={styles.headerBox}>
      <div className={styles.logo}>
        <IIJLogo size={40} animated={false} showText={false} />
      </div>
      <nav className={styles.navigation} aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              href={item.href}
              key={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <SearchBox className={styles.search} compact placeholder="Search..." shortcut="⌘K" />

      {/* To do: Refactor this to be a dynamic resuable component */}
      <div className={styles.roleSwitcher} aria-label="Choose workspace role">
        {ROLE_OPTIONS.map(({ id, label, Icon }) => (
          <button
            className={`${styles.roleButton} ${role === id ? styles.selected : ''}`}
            key={id}
            type="button"
            onClick={() => setRole(id)}
            aria-pressed={role === id}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {/* To do: Refactor this to be a dynamic resuable component */}
      {role === 'editor' ? (
        // Opens the New Assignment drawer on the dashboard (?new=assignment)
        <Link className={styles.newAssignment} href="/dashboard?new=assignment">
          <div>
            <span aria-hidden="true">+</span>
            <p>New Assignment</p>
          </div>
        </Link>
      ) : (
        <button className={styles.newAssignment} type="button">
          <div>
            {/* To Do: Replace ! with idea icon */}
            <span aria-hidden="true">!</span>
            <p>Make a Pitch</p>
          </div>
        </button>
      )}
    </header>
  );
}
