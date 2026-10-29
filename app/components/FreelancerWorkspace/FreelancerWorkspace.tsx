'use client';

import { useId, useState, type ReactNode } from 'react';
import { useWorkspace } from '../../hooks/useWorkspace';
import { FreelancerSidebar } from './FreelancerSidebar';
import { NotificationMenu, type WorkspaceNotification } from './NotificationMenu';
import styles from './FreelancerWorkspace.module.css';

export type FreelancerWorkspaceProps = { children: ReactNode; notifications?: WorkspaceNotification[] };

export function FreelancerWorkspace({ children, notifications }: FreelancerWorkspaceProps) {
  const [menuOpen, setMenuOpen] = useState(true);
  const menuId = useId();
  const { switchRole } = useWorkspace();
  return (
    <div className={styles.workspace}>
      <header className={styles.toolbar}>
        <button
          className={styles.iconButton}
          type="button"
          aria-label="Toggle freelancer menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className={styles.brand}>
          IIJ <span>Freelancer workspace</span>
        </span>
        <label className={styles.role}>
          Workspace
          <select
            aria-label="Workspace role"
            value="freelancer"
            onChange={(event) => {
              if (event.target.value === 'editor') switchRole('editor');
            }}
          >
            <option value="freelancer">Freelancer</option>
            <option value="editor">Editor</option>
          </select>
        </label>
        <NotificationMenu notifications={notifications} />
      </header>
      <div className={`${styles.body} ${menuOpen ? styles.expanded : ''}`}>
        {menuOpen && <FreelancerSidebar id={menuId} />}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
