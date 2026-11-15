import type { ReactNode } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ensureBasicUser } from '../../lib/profile';
import AdminHeader from './AdminHeader';
import { AdminBrand, AdminHeading, AdminNavLinks, AdminSignOut } from './AdminNav';
import styles from './admin.module.css';

/**
 * Admins never onboard, so the first visit stores the basics Clerk already knows. A database
 * blip must not close the admin area, so failures are only logged.
 */
async function rememberAdminBasics() {
  try {
    const { userId } = await auth();
    if (!userId) return;

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
    if (!email) return;

    await ensureBasicUser(userId, {
      email,
      firstName: user?.firstName ?? undefined,
      lastName: user?.lastName ?? undefined,
    });
  } catch (error) {
    console.error('Could not store the admin basic info.', error);
  }
}

/**
 * The Story Match team's moderation area: a sidebar of sections on desktop, a ☰ menu on phones.
 * Only people whose Clerk public metadata lists admin get past the middleware to reach this, and
 * the app dashboard sends them back here, so there is no link to the app to offer.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await rememberAdminBasics();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <AdminBrand />
        <AdminNavLinks />
        <AdminSignOut />
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
