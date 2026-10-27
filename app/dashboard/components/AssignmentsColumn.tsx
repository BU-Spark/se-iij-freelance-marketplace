'use client';

import { useState } from 'react';
import SegmentedControl, { type SegmentOption } from './SegmentedControl';
import AssignmentCard from '../../components/AssignmentCard/AssignmentCard';
import ReviewCandidates from '../../components/ReviewCandidates/ReviewCandidates';
import type { DeskAssignment, DeskFilter, RosterMember } from '../../types/dashboard.types';
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
  roster: RosterMember[];
};

/** Right column of the dashboard: assignment cards, status tabs and the Review candidates popup */
export default function AssignmentsColumn({ assignments, roster }: AssignmentsColumnProps) {
  // our own copy, so assigning someone updates the cards on screen
  // TODO: save to the backend once the API exists
  const [items, setItems] = useState(assignments);
  const [filter, setFilter] = useState<DeskFilter>('all');
  // which assignment's "Review candidates" popup is open (none = undefined)
  const [reviewingId, setReviewingId] = useState<string | undefined>();

  const visible = filterAssignments(items, filter);
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();
  const reviewing = items.find((a) => a.id === reviewingId);
  const nameOf = (id?: string) => roster.find((m) => m.id === id)?.name;

  // mark one assignment as assigned to this person, then close the popup
  const assign = (assignmentId: string, memberId: string) => {
    setItems((list) =>
      list.map((a) => (a.id === assignmentId ? { ...a, status: 'assigned', assignedToId: memberId } : a))
    );
    setReviewingId(undefined);
  };

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
              <AssignmentCard
                assignment={a}
                assignedName={nameOf(a.assignedToId)}
                onReview={() => setReviewingId(a.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {reviewing && (
        <ReviewCandidates
          assignment={reviewing}
          roster={roster}
          onAssign={(memberId) => assign(reviewing.id, memberId)}
          onClose={() => setReviewingId(undefined)}
        />
      )}
    </section>
  );
}
