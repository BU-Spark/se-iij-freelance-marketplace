'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useToast } from '../components/Toast/ToastProvider';
import { timeAgo } from '../utils/dashboard.utils';
import type { FlagReport, FlagStatus, FlagTarget } from '../types/admin.types';
import styles from './admin.module.css';

type Filter = 'all' | FlagTarget;
type View = 'todo' | 'done';

const KINDS: { value: FlagTarget; label: string; single: string }[] = [
  { value: 'pitch', label: 'Pitches', single: 'Flagged pitch' },
  { value: 'account', label: 'Accounts', single: 'Flagged account' },
  { value: 'assignment', label: 'Assignments', single: 'Flagged assignment' },
];

const kindOf = (value: FlagTarget) => KINDS.find((k) => k.value === value)!;

const STATUS_LABELS: Record<FlagStatus, string> = {
  open: 'New',
  reviewing: 'In review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

/** What the team sees after changing a flag */
const MESSAGES: Record<FlagStatus, string> = {
  open: 'Flag reopened.',
  reviewing: 'Flag marked as in review.',
  resolved: 'Flag resolved. You can still change it under Done.',
  dismissed: 'Flag dismissed. You can still change it under Done.',
};

const isClosed = (status: FlagStatus) => status === 'resolved' || status === 'dismissed';

/**
 * The flags raised across the marketplace, in one list: "To do" or "Done", narrowed by type if
 * needed. Each card says what it is, why it is here, and carries its own buttons. Decisions are
 * never final: they move to "Done", where they can be changed or reopened.
 */
export default function AdminInbox({ reports }: { reports: FlagReport[] }) {
  const [view, setView] = useState<View>('todo');
  const [filter, setFilter] = useState<Filter>('all');
  // To Do: send status changes to the backend once the flags API exists
  const [flags, setFlags] = useState(reports);
  const { showToast } = useToast();

  const flagsIn = (v: View) =>
    flags.filter((f) => isClosed(f.status) === (v === 'done')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const todo = flagsIn('todo');
  const done = flagsIn('done');
  const inView = view === 'todo' ? todo : done;
  const shown = filter === 'all' ? inView : inView.filter((f) => f.targetType === filter);
  const countFor = (f: Filter) => (f === 'all' ? inView.length : inView.filter((r) => r.targetType === f).length);

  const setStatus = (id: string, status: FlagStatus) => {
    setFlags((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));
    showToast(MESSAGES[status], status === 'reviewing' ? 'info' : 'success');
  };

  const button = (flag: FlagReport, status: FlagStatus, label: string, primary = false) => (
    <button
      type="button"
      className={clsx(styles.action, primary && styles.primaryAction)}
      onClick={() => setStatus(flag.id, status)}
    >
      {label}
    </button>
  );

  const flagCard = (flag: FlagReport) => (
    <>
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          <span className={clsx(styles.kindDot, styles[`kind_${flag.targetType}`])} aria-hidden="true" />
          {kindOf(flag.targetType).single}
          {flag.status !== 'open' && (
            <span className={clsx(styles.status, styles[flag.status])}>{STATUS_LABELS[flag.status]}</span>
          )}
        </span>
        <time className={styles.meta} dateTime={flag.createdAt}>
          {timeAgo(new Date(flag.createdAt))}
        </time>
      </div>

      <div>
        <h3 className={styles.cardTitle}>{flag.targetLabel}</h3>
        <p className={styles.meta}>
          Reported by <strong>{flag.reporterName}</strong>
        </p>
      </div>

      <p className={styles.reason}>
        <span className={styles.reasonLabel}>Why it was flagged</span>
        {flag.reason}
      </p>

      <div className={styles.cardFooter}>
        <p className={styles.hint}>
          {isClosed(flag.status)
            ? 'Changed your mind? You can switch the decision or reopen it.'
            : 'Dismiss if nothing is wrong. Resolve once you have dealt with it.'}
        </p>
        <div className={styles.actions} role="group" aria-label={`Actions for ${flag.targetLabel}`}>
          {flag.status === 'open' && button(flag, 'reviewing', 'Mark in review')}
          {!isClosed(flag.status) && button(flag, 'dismissed', 'Dismiss')}
          {!isClosed(flag.status) && button(flag, 'resolved', 'Resolve', true)}
          {flag.status === 'resolved' && button(flag, 'dismissed', 'Change to dismissed')}
          {flag.status === 'dismissed' && button(flag, 'resolved', 'Change to resolved')}
          {isClosed(flag.status) && button(flag, 'reviewing', 'Reopen', true)}
        </div>
      </div>
    </>
  );

  return (
    <section className={styles.inbox} aria-label="Inbox">
      <div className={styles.views} role="group" aria-label="Show">
        {(
          [
            ['todo', 'To do', todo.length],
            ['done', 'Done', done.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            className={styles.viewTab}
            aria-pressed={view === value}
            onClick={() => setView(value)}
          >
            {label}
            <span className={styles.viewCount}>{count}</span>
          </button>
        ))}
      </div>

      <div role="group" aria-label="Type" className={styles.filters}>
        {[{ value: 'all' as Filter, label: 'All' }, ...KINDS].map((k) => (
          <button
            key={k.value}
            type="button"
            aria-pressed={filter === k.value}
            className={styles.filter}
            onClick={() => setFilter(k.value)}
          >
            {k.label}
            <span className={styles.count}>{countFor(k.value)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>{view === 'todo' ? 'All caught up' : 'Nothing done yet'}</strong>
          {view === 'todo' ? 'No flags need review right now.' : 'Flags you resolve or dismiss will show here.'}
        </p>
      ) : (
        <ul className={styles.cards}>
          {shown.map((flag) => (
            <li key={flag.id} className={clsx(styles.card, styles[`edge_${flag.targetType}`])}>
              {flagCard(flag)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
