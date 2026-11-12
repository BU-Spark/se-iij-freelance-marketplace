'use client';

import { useState } from 'react';
import clsx from 'clsx';
import SegmentedControl from '../dashboard/components/SegmentedControl';
import { useToast } from '../components/Toast/ToastProvider';
import { timeAgo } from '../utils/dashboard.utils';
import type { FlagReport, FlagStatus, FlagTarget } from '../types/admin.types';
import styles from './admin.module.css';

/** One tab per kind of flagged thing, so the team reviews like with like */
const TABS: { value: FlagTarget; label: string; noun: string; single: string }[] = [
  { value: 'pitch', label: 'Pitches', noun: 'pitches', single: 'Flagged pitch' },
  { value: 'account', label: 'Accounts', noun: 'accounts', single: 'Flagged account' },
  { value: 'assignment', label: 'Assignments', noun: 'assignments', single: 'Flagged assignment' },
];

type View = 'queue' | 'closed';

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
  resolved: 'Flag resolved. You can still change it under Closed.',
  dismissed: 'Flag dismissed. You can still change it under Closed.',
};

const isClosed = (status: FlagStatus) => status === 'resolved' || status === 'dismissed';

/**
 * The queue of flags raised from across the marketplace, split by what was flagged. Each card says
 * what it is, why it is here, and carries its own buttons. Decisions are never final: closed flags
 * stay under "Closed", where they can be reopened or changed.
 */
export default function AdminInbox({ reports }: { reports: FlagReport[] }) {
  const [tab, setTab] = useState<FlagTarget>('pitch');
  const [view, setView] = useState<View>('queue');
  // To Do: send status changes to the backend once the flags API exists
  const [items, setItems] = useState(reports);
  const { showToast } = useToast();

  const inView = (v: View) => items.filter((r) => isClosed(r.status) === (v === 'closed'));
  const visible = inView(view);
  const countFor = (type: FlagTarget) => visible.filter((r) => r.targetType === type).length;
  const shown = visible.filter((r) => r.targetType === tab);
  const current = TABS.find((t) => t.value === tab)!;

  const setStatus = (id: string, status: FlagStatus) => {
    setItems((list) => list.map((r) => (r.id === id ? { ...r, status } : r)));
    showToast(MESSAGES[status], status === 'reviewing' ? 'info' : 'success');
  };

  const button = (report: FlagReport, status: FlagStatus, label: string, primary = false) => (
    <button
      type="button"
      className={clsx(styles.action, primary && styles.primaryAction)}
      onClick={() => setStatus(report.id, status)}
    >
      {label}
    </button>
  );

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
        <SegmentedControl<View>
          label="Flag status"
          options={[
            { value: 'queue', label: `Needs review (${inView('queue').length})` },
            { value: 'closed', label: `Closed (${inView('closed').length})` },
          ]}
          value={view}
          onChange={setView}
        />
      </div>

      {shown.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>{view === 'queue' ? 'All clear' : 'Nothing closed yet'}</strong>
          {view === 'queue'
            ? `No flagged ${current.noun} need review.`
            : `Resolved and dismissed ${current.noun} will show here.`}
        </p>
      ) : (
        <ul className={styles.cards}>
          {shown.map((report) => (
            <li key={report.id} className={clsx(styles.card, styles[`edge_${report.targetType}`])}>
              <div className={styles.cardTop}>
                <span className={styles.kind}>
                  <span className={clsx(styles.kindDot, styles[`kind_${report.targetType}`])} aria-hidden="true" />
                  {current.single}
                  {report.status !== 'open' && (
                    <span className={clsx(styles.status, styles[report.status])}>{STATUS_LABELS[report.status]}</span>
                  )}
                </span>
                <time className={styles.meta} dateTime={report.createdAt}>
                  {timeAgo(new Date(report.createdAt))}
                </time>
              </div>

              <div>
                <h3 className={styles.cardTitle}>{report.targetLabel}</h3>
                <p className={styles.meta}>
                  Reported by <strong>{report.reporterName}</strong>
                </p>
              </div>

              <p className={styles.reason}>
                <span className={styles.reasonLabel}>Why it was flagged</span>
                {report.reason}
              </p>

              <div className={styles.cardFooter}>
                <p className={styles.hint}>
                  {isClosed(report.status)
                    ? 'Changed your mind? You can switch the decision or reopen it.'
                    : 'Dismiss if nothing is wrong. Resolve once you have dealt with it.'}
                </p>
                <div className={styles.actions} role="group" aria-label={`Actions for ${report.targetLabel}`}>
                  {report.status === 'open' && button(report, 'reviewing', 'Mark in review')}
                  {!isClosed(report.status) && button(report, 'dismissed', 'Dismiss')}
                  {!isClosed(report.status) && button(report, 'resolved', 'Resolve', true)}
                  {report.status === 'resolved' && button(report, 'dismissed', 'Change to dismissed')}
                  {report.status === 'dismissed' && button(report, 'resolved', 'Change to resolved')}
                  {isClosed(report.status) && button(report, 'reviewing', 'Reopen', true)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
