import type { ReactNode } from 'react';
import AdminHeader from './AdminHeader';
import { AdminBrand, AdminHeading, AdminNavLinks } from './AdminNav';
import styles from './admin.module.css';

/**
 * The Story Match team's moderation area: a sidebar of sections on desktop, a ☰ menu on phones.
 * Only people whose Clerk public metadata lists admin get past the middleware to reach this, and
 * the app dashboard sends them back here, so there is no link to the app to offer.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <AdminBrand />
        <AdminNavLinks />
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
