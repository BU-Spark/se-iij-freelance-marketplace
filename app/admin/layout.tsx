import type { ReactNode } from 'react';
import Link from 'next/link';
import AdminHeader from './AdminHeader';
import { AdminBrand, AdminHeading, AdminNavLinks } from './AdminNav';
import styles from './admin.module.css';

/**
 * The Story Match team's moderation area: a sidebar of sections on desktop, a ☰ menu on phones.
 * To Do (auth): only let the Story Match team in. Anyone can open this until then.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <AdminBrand />
        <AdminNavLinks />
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to the app
        </Link>
      </aside>
      <div>
        <AdminHeader />
        <div className={styles.header}>
          <AdminHeading />
        </div>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
