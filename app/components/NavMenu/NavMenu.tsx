'use client';

import Link from 'next/link';
import { useId } from 'react';
import type { ProfileRole } from '../../types';
import SidePanel from '../SidePanel/SidePanel';
import Avatar from '../Avatar/Avatar';
import { ROLE_CONFIG } from '../Profile/config/roleConfig';
import { NAV_ITEMS } from './config/navConfig';
import { isCurrentPath } from '../../utils/nav.utils';
import styles from './NavMenu.module.css';

type NavMenuProps = {
  name: string;
  /** Roles this person has. The switch only shows if there are 2+. */
  roles: ProfileRole[];
  activeRole: ProfileRole;
  onRoleChange: (role: ProfileRole) => void;
  currentPath: string;
  profileHref: string;
  /** Small number bubbles, e.g. { pitches: 2 } */
  badges?: Record<string, number>;
  onClose: () => void;
  onSignOut: () => void;
};

export default function NavMenu({
  name,
  roles,
  activeRole,
  onRoleChange,
  currentPath,
  profileHref,
  badges = {},
  onClose,
  onSignOut,
}: NavMenuProps) {
  const labelId = useId();
  const items = NAV_ITEMS[activeRole];

  const footer = (
    <div className={styles.footer}>
      <Link href={profileHref} scroll={false} className={styles.footerLink} onClick={onClose}>
        <Avatar name={name} size={32} />
        My profile
      </Link>
      <button type="button" className={styles.signOut} onClick={onSignOut}>
        <span aria-hidden="true">⇤</span>
        Sign out
      </button>
    </div>
  );

  return (
    <SidePanel title="Menu" side="left" onClose={onClose} footer={footer}>
      {roles.length > 1 && (
        <div className={styles.switchBlock}>
          <p id={labelId} className={styles.label}>
            Working as
          </p>
          <div role="radiogroup" aria-labelledby={labelId} className={styles.switch}>
            {roles.map((role) => {
              const selected = role === activeRole;
              return (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={selected ? `${styles.option} ${styles.selected}` : styles.option}
                  onClick={() => onRoleChange(role)}
                >
                  {ROLE_CONFIG[role].label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <nav aria-label="Main">
        <ul className={styles.list}>
          {items.map((item) => {
            const current = isCurrentPath(currentPath, item);
            const count = badges[item.key];
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={current ? `${styles.item} ${styles.current}` : styles.item}
                  onClick={onClose}
                >
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.itemLabel}>{item.label}</span>
                  {count ? <span className={styles.badge}>{count}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </SidePanel>
  );
}
