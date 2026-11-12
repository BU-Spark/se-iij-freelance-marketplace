'use client';

import { useState } from 'react';
import clsx from 'clsx';
import Avatar from '../../components/Avatar/Avatar';
import { useToast } from '../../components/Toast/ToastProvider';
import { timeAgo } from '../../utils/dashboard.utils';
import type { VerificationRequest } from '../../types/admin.types';
import styles from '../admin.module.css';

type Status = VerificationRequest['status'];

const FILTERS: { value: Status; label: string; empty: string; hint: string }[] = [
  {
    value: 'pending',
    label: 'Pending',
    empty: 'Nobody is waiting on verification.',
    hint: 'Check the proof each person sent, then approve or reject them.',
  },
  {
    value: 'verified',
    label: 'Verified',
    empty: 'Nobody has been verified yet.',
    hint: 'These people show as verified. You can still take it away.',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    empty: 'No requests have been rejected.',
    hint: 'Rejected requests stay here in case you change your mind.',
  },
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
    <section className={styles.inbox}>
      <div role="group" aria-label="Verification status" className={styles.views}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={f.value === filter}
            className={styles.viewTab}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className={styles.viewCount}>{items.filter((r) => r.status === f.value).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>All clear</strong>
          {current.empty}
        </p>
      ) : (
        <>
          {/* said once for the whole tab, instead of on every person */}
          <p className={styles.hint}>{current.hint}</p>

          <ul className={styles.people}>
            {shown.map((request) => (
              <li key={request.id} className={styles.person}>
                <Avatar name={request.name} size={40} />
                <div className={styles.personBody}>
                  <h2 className={styles.personName}>{request.name}</h2>
                  <p className={styles.meta}>
                    {ROLE_LABELS[request.role]} · {request.location} ·{' '}
                    <time dateTime={request.requestedAt}>{timeAgo(new Date(request.requestedAt))}</time>
                  </p>
                  <p className={styles.proof}>{request.evidence}</p>
                </div>
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
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
