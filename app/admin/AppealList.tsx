'use client';

import { useState } from 'react';
import { useToast } from '../components/Toast/ToastProvider';
import { timeAgo } from '../utils/dashboard.utils';
import type { Appeal } from '../../lib/appeals';
import styles from './admin.module.css';

/**
 * Suspended people asking for a second look, above the flags queue. Reactivating the account is the
 * decision that settles the appeal, and the accounts API resolves it on the way through.
 */
export default function AppealList({ appeals }: { appeals: Appeal[] }) {
  const [items, setItems] = useState(appeals);
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();

  const reactivate = async (appeal: Appeal) => {
    setBusy(appeal.id);

    try {
      const response = await fetch(`/api/admin/accounts/${appeal.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        showToast(body?.error ?? 'Unable to reactivate this account right now.', 'error');
        return;
      }

      setItems((list) => list.filter((item) => item.id !== appeal.id));
      showToast(`${appeal.name} is active again.`, 'success');
    } catch (error) {
      console.error('Could not reactivate the account from its appeal.', error);
      showToast('Unable to reactivate this account right now.', 'error');
    } finally {
      setBusy(null);
    }
  };

  // Nothing waiting: stay out of the way of the flags queue
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="appeals-title" className={styles.appealsSection}>
      <div className={styles.appealsHeader}>
        <h2 id="appeals-title" className={styles.appealsTitle}>
          Appeals waiting
          <span className={styles.count}>{items.length}</span>
        </h2>
        <p className={styles.meta}>Suspended people asking for their account to be looked at again.</p>
      </div>

      <ul className={styles.list}>
        {items.map((appeal) => (
          <li key={appeal.id} className={styles.row}>
            <div className={styles.rowTop}>
              <div>
                <h3 className={styles.rowTitle}>{appeal.name}</h3>
                <p className={styles.meta}>{appeal.email}</p>
              </div>
              <time className={styles.meta} dateTime={appeal.createdAt}>
                {timeAgo(new Date(appeal.createdAt))}
              </time>
            </div>

            <p className={styles.reason}>
              <span className={styles.reasonLabel}>Their appeal</span>
              {appeal.message}
            </p>

            {appeal.suspensionReason && (
              <p className={styles.reason}>
                <span className={styles.reasonLabel}>Why they were suspended</span>
                {appeal.suspensionReason}
              </p>
            )}

            <div className={styles.rowFooter}>
              <p className={styles.meta}>Reactivating the account closes this appeal.</p>
              <div className={styles.actions} role="group" aria-label={`Appeal from ${appeal.name}`}>
                <button
                  type="button"
                  className={styles.action}
                  disabled={busy === appeal.id}
                  onClick={() => void reactivate(appeal)}
                >
                  {busy === appeal.id ? 'Reactivating…' : 'Reactivate account'}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
