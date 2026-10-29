'use client';

import styles from './FreelancerWorkspace.module.css';

export type WorkspaceNotification = { id: string; message: string; unread: boolean };
export type NotificationMenuProps = { notifications?: WorkspaceNotification[] };

export function NotificationMenu({ notifications = [] }: NotificationMenuProps) {
  const unread = notifications.filter((item) => item.unread).length;
  return (
    <details className={styles.notifications}>
      <summary className={styles.iconButton} aria-label={`Notifications, ${unread} unread`}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </svg>
        {unread > 0 && <span className={styles.dot} />}
      </summary>
      <section className={styles.notificationPanel} aria-label="Notifications">
        <h2>Notifications</h2>
        {notifications.length ? (
          <ul>
            {notifications.map((item) => (
              <li key={item.id}>
                {item.unread && <strong>Unread: </strong>}
                {item.message}
              </li>
            ))}
          </ul>
        ) : (
          <p>No notifications yet.</p>
        )}
      </section>
    </details>
  );
}
