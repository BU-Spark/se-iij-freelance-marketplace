'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/header/Header';
import SegmentedControl, { type SegmentOption } from './components/SegmentedControl';
import styles from './dashboard.module.css';
import { ASSIGNMENTS, EDITOR_NAME, NEW_PITCHES, ROSTER } from './constants';
import { RosterCard } from '../components';

import { countByStatus, countOnRoster, formatDeadline, formatDeskDate, formatRate } from '../utils/dashboard.utils';
import type { DeskFilter, RosterView } from '../types/dashboard.types';

/*
 * Editor dispatch dashboard.
 */

const VIEWS: SegmentOption<RosterView>[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

const FILTERS: SegmentOption<DeskFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'assigned', label: 'Assigned' },
];

export default function Dashboard() {
  const [view, setView] = useState<RosterView>('day');
  const [filter, setFilter] = useState<DeskFilter>('all');
  const counts = countByStatus(ASSIGNMENTS);
  const assignments = ASSIGNMENTS.filter((assignment) => filter === 'all' || assignment.status === filter);

  return (
    <div className={styles.shell}>
      <Header />

      {/* ---- Status bar ---- */}
      <div className={styles.statusBar}>
        <p>
          <strong>{formatDeskDate(new Date())}</strong> • Editor: {EDITOR_NAME} •{' '}
          <Link href="/dashboard/pitches" className={styles.inboxLink}>
            {NEW_PITCHES} new pitches in inbox →
          </Link>
        </p>
        <ul aria-label="Assignment counts" className={styles.counts}>
          <li style={{ ['--dot' as string]: 'var(--c-blue)' }}>{counts.open} open</li>
          <li style={{ ['--dot' as string]: 'var(--c-amber)' }}>{counts.invited} pending</li>
          <li style={{ ['--dot' as string]: 'var(--c-green)' }}>{counts.assigned} assigned</li>
        </ul>
      </div>

      <main className={styles.columns}>
        {/* ---- Left column: who is available ---- */}
        <section aria-labelledby="availability-heading">
          <div className={styles.sectionHead}>
            <div>
              <h2 id="availability-heading" className={styles.sectionTitle}>
                Availability
              </h2>
              <p className={styles.sectionSub}>
                {countOnRoster(ROSTER)} of {ROSTER.length} on roster
              </p>
            </div>
            <SegmentedControl label="Availability range" options={VIEWS} value={view} onChange={setView} />
          </div>

          <ul className={styles.list}>
            {ROSTER.map((m) => (
              <li key={m.id}>
                <RosterCard member={m} view={view} />
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Right column: assignments ---- */}
        <section aria-labelledby="assignments-heading">
          <div className={styles.sectionHead}>
            <h2 id="assignments-heading" className={styles.sectionTitle}>
              Assignments
            </h2>
            <SegmentedControl label="Filter assignments" options={FILTERS} value={filter} onChange={setFilter} />
          </div>

          <ul className={styles.list}>
            {assignments.map((a) => (
              <li key={a.id} className={styles.assignmentItem}>
                <article className={styles.assignmentCard}>
                  <div className={styles.assignmentTop}>
                    <span className={styles.category}>{a.category}</span>
                    <span className={`${styles.status} ${styles[a.status]}`}>{a.urgent ? 'Urgent' : a.status}</span>
                  </div>
                  <h3 className={styles.assignmentTitle}>{a.title}</h3>
                  <p className={styles.contact}>
                    Point of contact: {a.contact.name}, {a.contact.desk}
                  </p>
                  <dl className={styles.details}>
                    <div>
                      <dt>Deadline</dt>
                      <dd>{formatDeadline(a.deadline)}</dd>
                    </div>
                    <div>
                      <dt>Location</dt>
                      <dd>{a.location}</dd>
                    </div>
                    <div>
                      <dt>Length</dt>
                      <dd>{a.length}</dd>
                    </div>
                    <div>
                      <dt>Rate</dt>
                      <dd>{formatRate(a.rate)}</dd>
                    </div>
                  </dl>
                  <p className={styles.interested}>{a.interestedIds.length} interested</p>
                </article>
              </li>
            ))}
          </ul>
          {assignments.length === 0 && <p className={styles.empty}>No assignments in this view.</p>}
        </section>
      </main>
    </div>
  );
}
