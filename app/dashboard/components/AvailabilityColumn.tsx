'use client';

import { useState } from 'react';
import Link from 'next/link';
import SegmentedControl, { type SegmentOption } from './SegmentedControl';
import RosterCard from '../../components/RosterCard/RosterCard';
import { useDeskQuery } from './deskQuery';
import type { RosterMember, RosterView } from '../../types/dashboard.types';
import { countOnRoster, memberMatches } from '../../utils/dashboard.utils';
import styles from '../dashboard.module.css';

const VIEWS: SegmentOption<RosterView>[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

type AvailabilityColumnProps = {
  roster: RosterMember[];
  /** the roster could not be read, which is not the same as having nobody on it */
  loadFailed?: boolean;
};

/** Left column of the dashboard: roster cards with a day / week / month toggle */
export default function AvailabilityColumn({ roster, loadFailed = false }: AvailabilityColumnProps) {
  const [view, setView] = useState<RosterView>('day');
  const { query } = useDeskQuery();
  const shown = roster.filter((m) => memberMatches(m, query));

  return (
    <section aria-labelledby="availability-heading">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="availability-heading" className={styles.sectionTitle}>
            Availability
          </h2>
          <p className={styles.sectionSub}>
            {query.trim() ? `${shown.length} matching` : `${countOnRoster(roster)} of ${roster.length} on roster`}
          </p>
        </div>
        <SegmentedControl label="Availability range" options={VIEWS} value={view} onChange={setView} />
      </div>

      <ul className={styles.list}>
        {loadFailed ? (
          <li className={styles.emptyRoster} role="alert">
            <strong>Your roster couldn&apos;t be loaded</strong>
            <span>Please try again in a moment.</span>
          </li>
        ) : roster.length === 0 ? (
          <li className={styles.emptyRoster}>
            <strong>No one on your roster yet</strong>
            <span>
              Freelancers you invite appear here once they accept.{' '}
              <Link href="/dashboard/roster">Build your roster</Link>
            </span>
          </li>
        ) : shown.length === 0 ? (
          <li className={styles.emptyRoster}>
            <strong>No one matches “{query.trim()}”</strong>
            <span>Try a name, beat or city.</span>
          </li>
        ) : (
          shown.map((m) => (
            <li key={m.id}>
              <RosterCard member={m} view={view} />
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
