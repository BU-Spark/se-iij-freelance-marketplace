'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useToast } from '../../components/Toast/ToastProvider';
import { timeAgo } from '../../utils/dashboard.utils';
import type { VerificationRequest } from '../../types/admin.types';
import styles from '../admin.module.css';

type Status = VerificationRequest['status'];

const FILTERS: { value: Status; label: string; empty: string }[] = [
  { value: 'pending', label: 'Pending', empty: 'Nobody is waiting on verification.' },
  { value: 'verified', label: 'Verified', empty: 'Nobody has been verified yet.' },
  { value: 'rejected', label: 'Rejected', empty: 'No requests have been rejected.' },
];

/** The buttons each status offers; every decision can be changed later */
const ACTIONS: Record<Status, { to: Status; label: string; primary?: boolean }[]> = {
  pending: [
    { to: 'rejected', label: 'Reject' },
    { to: 'verified', label: 'Approve', primary: true },
  ],
  verified: [
    { to: 'pending', label: 'Move back to pending' },
    { to: 'rejected', label: 'Reject' },
  ],
  rejected: [
    { to: 'pending', label: 'Move back to pending' },
    { to: 'verified', label: 'Approve', primary: true },
  ],
};

const MESSAGES: Record<Status, (name: string) => string> = {
  pending: (name) => `${name} is back in pending.`,
  verified: (name) => `${name} is now verified.`,
  rejected: (name) => `${name}'s request was rejected. You can still approve it under Rejected.`,
};

const ROLE_LABELS: Record<VerificationRequest['role'], string> = { freelancer: 'Freelancer', editor: 'Editor' };

export default function VerificationList({ requests }: { requests: VerificationRequest[] }) {
  const [filter, setFilter] = useState<Status>('pending');
  // To Do: send status changes to the backend once the verification API exists
  const [items, setItems] = useState(requests);
  const { showToast } = useToast();

  const shown = items.filter((r) => r.status === filter);
  const current = FILTERS.find((f) => f.value === filter)!;

  const setStatus = (request: VerificationRequest, status: Status) => {
    setItems((list) => list.map((r) => (r.id === request.id ? { ...r, status } : r)));
    showToast(MESSAGES[status](request.name), status === 'rejected' ? 'info' : 'success');
  };

  return (
    <section>
      <div className={styles.toolbar}>
        <div role="group" aria-label="Verification status" className={styles.filters}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={f.value === filter}
              className={styles.filter}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className={styles.count}>{items.filter((r) => r.status === f.value).length}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>All clear</strong>
          {current.empty}
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((request) => (
            <li key={request.id} className={clsx(styles.row, styles[request.status])}>
              <div className={styles.rowTop}>
                <div>
                  <h2 className={styles.rowTitle}>{request.name}</h2>
                  <p className={styles.meta}>
                    {ROLE_LABELS[request.role]} · {request.location}
                  </p>
                </div>
                <span className={clsx(styles.status, styles[request.status])}>{current.label}</span>
              </div>
              <p className={styles.reason}>
                <span className={styles.reasonLabel}>Proof submitted</span>
                {request.evidence}
              </p>
              <div className={styles.rowFooter}>
                <p className={styles.meta}>
                  Requested <time dateTime={request.requestedAt}>{timeAgo(new Date(request.requestedAt))}</time>
                </p>
                <div className={styles.actions} role="group" aria-label={`Actions for ${request.name}`}>
                  {ACTIONS[request.status].map((a) => (
                    <button
                      key={a.to}
                      type="button"
                      className={clsx(styles.action, a.primary && styles.primaryAction)}
                      onClick={() => setStatus(request, a.to)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
