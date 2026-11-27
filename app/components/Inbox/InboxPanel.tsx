'use client';

import { useState } from 'react';
import Link from 'next/link';
import SidePanel from '../SidePanel/SidePanel';
import type { Inbox } from '../../hooks/useInbox';
import { timeAgo } from '../../utils/dashboard.utils';
import styles from './Inbox.module.css';

const KIND_LABELS = { pitch: 'Pitch', roster: 'Roster', assignment: 'Assignment' };

type InboxPanelProps = { inbox: Inbox; onClose: () => void };

/** The list behind the header's inbox button */
export default function InboxPanel({ inbox, onClose }: InboxPanelProps) {
  const { items, unreadCount, loading, markRead } = inbox;
  const [unreadOnly, setUnreadOnly] = useState(false);
  const shown = unreadOnly ? items.filter((item) => item.unread) : items;

  const filters = (
    <div className={styles.toolbar}>
      <div className={styles.filters} role="group" aria-label="Show">
        <button type="button" aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>
          All
        </button>
        <button type="button" aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>
          Unread{unreadCount > 0 && ` ${unreadCount}`}
        </button>
      </div>
      <button
        type="button"
        className={styles.markAll}
        disabled={unreadCount === 0}
        onClick={() => markRead(items.filter((item) => item.unread).map((item) => item.key))}
      >
        Mark all read
      </button>
    </div>
  );

  return (
    <SidePanel title="Inbox" onClose={onClose} header={filters}>
      {shown.length === 0 ? (
        <p className={styles.empty}>{loading ? 'Loading updates…' : 'You’re all caught up.'}</p>
      ) : (
        <ul className={styles.list}>
          {shown.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={item.unread ? `${styles.row} ${styles.unread}` : styles.row}
                onClick={() => {
                  markRead([item.key]);
                  onClose();
                }}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.text}>
                  <span className={styles.title}>
                    {item.unread && <span className={styles.srOnly}>Unread: </span>}
                    {item.title}
                  </span>
                  <span className={styles.meta}>
                    <span className={`${styles.kind} ${styles[item.kind]}`}>{KIND_LABELS[item.kind]}</span>
                    {item.date && <span>{timeAgo(item.date)}</span>}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SidePanel>
  );
}
