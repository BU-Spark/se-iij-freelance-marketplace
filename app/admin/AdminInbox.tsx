'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { timeAgo } from '../utils/dashboard.utils';
import type { FlagReport, FlagStatus, FlagTarget } from '../types/admin.types';
import styles from './admin.module.css';

/** One tab per kind of flagged thing, so the team reviews like with like */
const TABS: { value: FlagTarget; label: string; noun: string }[] = [
  { value: 'pitch', label: 'Pitches', noun: 'pitches' },
  { value: 'account', label: 'Accounts', noun: 'accounts' },
  { value: 'assignment', label: 'Assignments', noun: 'assignments' },
];

const STATUS_LABELS: Record<FlagStatus, string> = {
  open: 'New',
  reviewing: 'In review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

/** The queue of flags raised from across the marketplace, split by what was flagged */
export default function AdminInbox({ reports }: { reports: FlagReport[] }) {
  const [tab, setTab] = useState<FlagTarget>('pitch');

  const countFor = (type: FlagTarget) => reports.filter((r) => r.targetType === type).length;
  const shown = reports.filter((r) => r.targetType === tab);
  const current = TABS.find((t) => t.value === tab)!;

  return (
    <section>
      <div className={styles.toolbar}>
        <div role="group" aria-label="Flag type" className={styles.filters}>
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={t.value === tab}
              className={styles.filter}
              onClick={() => setTab(t.value)}
            >
              {t.label}
              <span className={styles.count}>{countFor(t.value)}</span>
            </button>
          ))}
        </div>
        <p className={styles.summary}>
          {reports.length} {reports.length === 1 ? 'flag' : 'flags'} waiting for review
        </p>
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>All clear</strong>
          No flagged {current.noun} right now.
        </p>
      ) : (
        <ul className={styles.list}>
          {shown.map((report) => (
            <li key={report.id} className={clsx(styles.row, styles[report.status])}>
              <div className={styles.rowTop}>
                <h2 className={styles.rowTitle}>{report.targetLabel}</h2>
                <span className={clsx(styles.status, styles[report.status])}>{STATUS_LABELS[report.status]}</span>
              </div>
              <p className={styles.reason}>
                <span className={styles.reasonLabel}>Reason</span>
                {report.reason}
              </p>
              <p className={styles.meta}>
                Reported by <strong>{report.reporterName}</strong> ·{' '}
                <time dateTime={report.createdAt}>{timeAgo(new Date(report.createdAt))}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
