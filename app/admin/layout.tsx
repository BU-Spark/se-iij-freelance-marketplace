import type { ReactNode } from 'react';
import AdminNav from './AdminNav';
import styles from './admin.module.css';

/**
 * The Story Match team's moderation area.
 * To Do (auth): only let the Story Match team in. Anyone can open this until then.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Story Match team</p>
        <h1 className={styles.title}>Admin</h1>
        <AdminNav />
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
