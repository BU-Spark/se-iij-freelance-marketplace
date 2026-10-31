'use client';

import Link from 'next/link';
import { useWorkspace } from '../../hooks/useWorkspace';
import IIJLogo from '../IIJLogo/IIJLogo';
import { SearchBox } from '../search/SearchBox';
import { NAV_ITEMS, ROLE_OPTIONS } from './constants';
import styles from './header.module.css';

function isNavItemActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const { role, switchRole, pathname } = useWorkspace();

  return (
    <header className={styles.headerBox}>
      <div className={styles.logo}>
        <IIJLogo size={40} animated={false} showText={false} />
      </div>
      <nav className={styles.navigation} aria-label="Main navigation">
        {NAV_ITEMS[role].map((item) => {
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

      <div className={styles.roleSwitcher} aria-label="Choose workspace role">
        {ROLE_OPTIONS.map(({ id, label, Icon }) => (
          <button
            className={`${styles.roleButton} ${role === id ? styles.selected : ''}`}
            key={id}
            type="button"
            onClick={() => switchRole(id)}
            aria-pressed={role === id}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {role === 'editor' ? (
        // Opens the New Assignment drawer on the dashboard (?new=assignment)
        <Link className={styles.newAssignment} href="/dashboard?new=assignment">
          <div>
            <span aria-hidden="true">+</span>
            <p>New Assignment</p>
          </div>
        </Link>
      ) : (
        <Link className={styles.newAssignment} href="/dashboard/freelancer/make-a-pitch">
          <div>
            <span aria-hidden="true">+</span>
            <p>Make a Pitch</p>
          </div>
        </Link>
      )}
    </header>
  );
}
