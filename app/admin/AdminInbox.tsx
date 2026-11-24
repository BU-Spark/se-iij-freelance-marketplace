'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useToast } from '../components/Toast/ToastProvider';
import { timeAgo } from '../utils/dashboard.utils';
import type { Appeal } from '../../lib/appeals';
import type { FlagReport, FlagStatus, FlagTarget } from '../types/admin.types';
import styles from './admin.module.css';

type Kind = 'appeal' | FlagTarget;
type Filter = 'all' | Kind;
type View = 'todo' | 'done';

/** One thing in the inbox: a suspended person's appeal, or a flag someone raised */
type Entry = { kind: 'appeal'; appeal: Appeal } | { kind: FlagTarget; flag: FlagReport };

const KINDS: { value: Kind; label: string; single: string }[] = [
  { value: 'appeal', label: 'Appeals', single: 'Appeal' },
  { value: 'pitch', label: 'Pitches', single: 'Flagged pitch' },
  { value: 'account', label: 'Accounts', single: 'Flagged account' },
  { value: 'assignment', label: 'Assignments', single: 'Flagged assignment' },
];

const kindOf = (value: Kind) => KINDS.find((k) => k.value === value)!;

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
const createdAt = (e: Entry) => (e.kind === 'appeal' ? e.appeal.createdAt : e.flag.createdAt);
const idOf = (e: Entry) => (e.kind === 'appeal' ? e.appeal.id : e.flag.id);

/**
 * Everything waiting on the Story Match team, in one list: appeals from suspended people and flags
 * raised across the marketplace. Each card says what it is, why it is here, and carries its own
 * buttons, so nothing has to be opened first. Flag decisions are never final: they move to "Done",
 * where they can be changed or reopened.
 */
export default function AdminInbox({ appeals = [], reports }: { appeals?: Appeal[]; reports: FlagReport[] }) {
  const [view, setView] = useState<View>('todo');
  const [filter, setFilter] = useState<Filter>('all');
  const [appealItems, setAppealItems] = useState(appeals);
  const [flags, setFlags] = useState(reports);
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();

  const entriesIn = (v: View): Entry[] => {
    const flagEntries: Entry[] = flags
      .filter((f) => isClosed(f.status) === (v === 'done'))
      .map((flag) => ({ kind: flag.targetType, flag }));
    // reactivating closes an appeal, so open appeals are always to do
    const appealEntries: Entry[] = v === 'todo' ? appealItems.map((appeal) => ({ kind: 'appeal', appeal })) : [];
    return [...appealEntries, ...flagEntries].sort((a, b) => createdAt(b).localeCompare(createdAt(a)));
  };

  const todo = entriesIn('todo');
  const done = entriesIn('done');
  const inView = view === 'todo' ? todo : done;
  const shown = filter === 'all' ? inView : inView.filter((e) => e.kind === filter);
  const countFor = (f: Filter) => (f === 'all' ? inView.length : inView.filter((e) => e.kind === f).length);

  const setStatus = async (id: string, status: FlagStatus) => {
    setBusy(id);

    try {
      const response = await fetch(`/api/admin/flags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        showToast(body?.error ?? 'Unable to update this flag right now.', 'error');
        return;
      }

      setFlags((list) => list.map((f) => (f.id === id ? { ...f, status } : f)));
      showToast(MESSAGES[status], status === 'reviewing' ? 'info' : 'success');
    } catch (error) {
      console.error('Could not update a flag from the inbox.', error);
      showToast('Unable to update this flag right now.', 'error');
    } finally {
      setBusy(null);
    }
  };

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

      setAppealItems((list) => list.filter((item) => item.id !== appeal.id));
      showToast(`${appeal.name} is active again.`, 'success');
    } catch (error) {
      console.error('Could not reactivate the account from its appeal.', error);
      showToast('Unable to reactivate this account right now.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const button = (flag: FlagReport, status: FlagStatus, label: string, primary = false) => (
    <button
      type="button"
      className={clsx(styles.action, primary && styles.primaryAction)}
      disabled={busy === flag.id}
      onClick={() => void setStatus(flag.id, status)}
    >
      {label}
    </button>
  );

  const appealCard = (appeal: Appeal) => (
    <>
      <div className={styles.cardTop}>
        <span className={styles.kind}>
          <span className={clsx(styles.kindDot, styles.kind_appeal)} aria-hidden="true" />
          Appeal
        </span>
        <time className={styles.meta} dateTime={appeal.createdAt}>
          {timeAgo(new Date(appeal.createdAt))}
        </time>
      </div>

      <div>
        <h3 className={styles.cardTitle}>{appeal.name}</h3>
        <p className={styles.meta}>{appeal.email} · suspended and asking to be let back in</p>
      </div>

      <div className={styles.reasons}>
        <p className={styles.reason}>
          <span className={styles.reasonLabel}>What they said</span>
          {appeal.message}
        </p>
        {appeal.suspensionReason && (
          <p className={styles.reason}>
            <span className={styles.reasonLabel}>Why they were suspended</span>
            {appeal.suspensionReason}
          </p>
        )}
      </div>

      <div className={styles.cardFooter}>
        <p className={styles.hint}>Reactivating lets them sign in again and closes this appeal.</p>
        <div className={styles.actions} role="group" aria-label={`Appeal from ${appeal.name}`}>
          <button
            type="button"
            className={clsx(styles.action, styles.primaryAction)}
            disabled={busy === appeal.id}
            onClick={() => void reactivate(appeal)}
          >
            {busy === appeal.id ? 'Reactivating…' : 'Reactivate account'}
          </button>
        </div>
      </div>
    </>
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
          {view === 'todo'
            ? 'Nothing is waiting on the team right now.'
            : 'Flags you resolve or dismiss will show here.'}
        </p>
      ) : (
        <ul className={styles.cards}>
          {shown.map((entry) => (
            <li key={idOf(entry)} className={clsx(styles.card, styles[`edge_${entry.kind}`])}>
              {entry.kind === 'appeal' ? appealCard(entry.appeal) : flagCard(entry.flag)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
