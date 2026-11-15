'use client';

import { useState } from 'react';
import SidePanel from '../components/SidePanel/SidePanel';
import menu from '../components/NavMenu/NavMenu.module.css';
import { AdminBrand, AdminNavLinks, AdminSignOut } from './AdminNav';
import styles from './admin.module.css';

/** Phone-only top bar: the sidebar is hidden there, so ☰ opens the same sections in a panel */
export default function AdminHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.topBar}>
      <button
        type="button"
        className={menu.menuButton}
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        aria-expanded={open}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <AdminBrand />

      {open && (
        <SidePanel title="Admin" side="left" onClose={() => setOpen(false)}>
          <AdminNavLinks onNavigate={() => setOpen(false)} />
          <AdminSignOut />
        </SidePanel>
      )}
    </header>
  );
}
