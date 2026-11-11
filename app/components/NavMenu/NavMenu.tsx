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
  /** Where clicking yourself goes: the settings page that holds your profile */
  settingsHref: string;
  /** Small number bubbles, e.g. { pitches: 2 } */
  badges?: Record<string, number>;
  onClose: () => void;
};

export default function NavMenu({
  name,
  roles,
  activeRole,
  onRoleChange,
  currentPath,
  settingsHref,
  badges = {},
  onClose,
}: NavMenuProps) {
  const labelId = useId();
  const items = NAV_ITEMS[activeRole];

  const footer = (
    <div className={styles.footer}>
      {/* clicking yourself leads to settings; the side panel has no Settings item of its own */}
      <Link href={settingsHref} className={styles.footerLink} onClick={onClose} aria-label="My settings">
        <Avatar name={name} size={32} />
        <span className={styles.who}>
          <span className={styles.whoName}>{name || 'My settings'}</span>
          <span className={styles.whoHint}>Profile and availability</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ›
        </span>
      </Link>
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
