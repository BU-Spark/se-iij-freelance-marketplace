'use client';

import { useState } from 'react';
import SegmentedControl, { type SegmentOption } from './SegmentedControl';
import AssignmentCard from '../../components/AssignmentCard/AssignmentCard';
import type { DeskAssignment, DeskFilter } from '../../types/dashboard.types';
import { filterAssignments } from '../../utils/dashboard.utils';
import styles from '../dashboard.module.css';

const FILTERS: SegmentOption<DeskFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'assigned', label: 'Assigned' },
];

type AssignmentsColumnProps = {
  assignments: DeskAssignment[];
};

/** Right column of the dashboard: assignment cards with All / Open / Invited / Assigned tabs */
export default function AssignmentsColumn({ assignments }: AssignmentsColumnProps) {
  const [filter, setFilter] = useState<DeskFilter>('all');
  const visible = filterAssignments(assignments, filter);
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();

  return (
    <section aria-labelledby="assignments-heading">
      <div className={styles.sectionHead}>
        <h2 id="assignments-heading" className={styles.sectionTitle}>
          Assignments
        </h2>
        <SegmentedControl label="Filter assignments" options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {visible.length === 0 ? (
        <p className={styles.sectionSub}>No {filterLabel} assignments.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((a) => (
            <li key={a.id}>
              <AssignmentCard assignment={a} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
