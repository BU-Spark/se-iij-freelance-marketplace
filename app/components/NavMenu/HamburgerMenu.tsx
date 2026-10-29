'use client';

import { useState, type ComponentProps } from 'react';
import NavMenu from './NavMenu';
import styles from './NavMenu.module.css';

/** Everything NavMenu takes, except onClose: the ☰ button handles opening and closing */
type HamburgerMenuProps = Omit<ComponentProps<typeof NavMenu>, 'onClose'>;

/**
 * The ☰ button plus the menu it opens.
 * Self-contained so any header can drop it in without managing open/closed state.
 */
export default function HamburgerMenu(props: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && <NavMenu {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
