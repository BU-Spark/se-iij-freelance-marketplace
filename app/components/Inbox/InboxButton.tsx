'use client';

import { useCallback, useState } from 'react';
import type { Inbox } from '../../hooks/useInbox';
import InboxPanel from './InboxPanel';
import styles from './Inbox.module.css';

/** The header's inbox icon with its unread count, plus the panel it opens */
export default function InboxButton({ inbox }: { inbox: Inbox }) {
  const [open, setOpen] = useState(false);
  // stable, because the side panel moves focus whenever its close handler changes
  const close = useCallback(() => setOpen(false), []);
  const { unreadCount } = inbox;

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen(true)}
        aria-label={unreadCount > 0 ? `Open inbox, ${unreadCount} unread` : 'Open inbox'}
        aria-expanded={open}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1.5 3h5L16 13h5" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.count} aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && <InboxPanel inbox={inbox} onClose={close} />}
    </>
  );
}
