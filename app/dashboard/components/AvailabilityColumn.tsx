'use client';

import { useState } from 'react';
import SegmentedControl, { type SegmentOption } from './SegmentedControl';
import RosterCard from '../../components/RosterCard/RosterCard';
import type { RosterMember, RosterView } from '../../types/dashboard.types';
import { countOnRoster } from '../../utils/dashboard.utils';
import styles from '../dashboard.module.css';

const VIEWS: SegmentOption<RosterView>[] = [
  { value: 'day', label: 'day' },
  { value: 'week', label: 'week' },
  { value: 'month', label: 'month' },
];

type AvailabilityColumnProps = {
  roster: RosterMember[];
};

/** Left column of the dashboard: roster cards with a day / week / month toggle */
export default function AvailabilityColumn({ roster }: AvailabilityColumnProps) {
  const [view, setView] = useState<RosterView>('day');

  return (
    <section aria-labelledby="availability-heading">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="availability-heading" className={styles.sectionTitle}>
            Availability
          </h2>
          <p className={styles.sectionSub}>
            {countOnRoster(roster)} of {roster.length} on roster
          </p>
        </div>
        <SegmentedControl label="Availability range" options={VIEWS} value={view} onChange={setView} />
      </div>

      <ul className={styles.list}>
        {roster.map((m) => (
          <li key={m.id}>
            <RosterCard member={m} view={view} />
          </li>
        ))}
      </ul>
    </section>
  );
}
