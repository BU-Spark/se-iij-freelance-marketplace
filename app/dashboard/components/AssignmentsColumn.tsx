'use client';

import { useEffect, useState } from 'react';
import SegmentedControl, { type SegmentOption } from './SegmentedControl';
import AssignmentCard from '../../components/AssignmentCard/AssignmentCard';
import ReviewCandidates from '../../components/ReviewCandidates/ReviewCandidates';
import AssignmentsTable from './AssignmentsTable';
import useLocalStorage from '../../hooks/useLocalStorage';
import { useDeskQuery } from './deskQuery';
import { useToast } from '../../components/Toast/ToastProvider';
import type { DeskAssignment, DeskFilter, RosterMember } from '../../types/dashboard.types';
import { assignmentMatches, assignmentRelevanceFields, filterAssignments } from '../../utils/dashboard.utils';
import { rankBy } from '../../utils/relevance.utils';
import styles from '../dashboard.module.css';

const FILTERS: SegmentOption<DeskFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'assigned', label: 'Assigned' },
];

/** comfort = the cards; table = one dense row each */
type DeskView = 'comfort' | 'table';

const VIEWS: SegmentOption<DeskView>[] = [
  { value: 'comfort', label: 'comfort' },
  { value: 'table', label: 'table' },
];

type AssignmentsColumnProps = {
  assignments: DeskAssignment[];
  roster: RosterMember[];
  /** where the next page starts; null/absent means everything is already here */
  nextCursor?: string | null;
  /** every assignment the editor can see, so "Showing 20 of 57" stays honest */
  total?: number;
};

/** Right column of the dashboard: assignment cards, status tabs and the Review candidates popup */
export default function AssignmentsColumn({ assignments, roster, nextCursor = null, total }: AssignmentsColumnProps) {
  const { showToast } = useToast();
  const { query } = useDeskQuery();
  // our own copy, so assigning someone updates the desk without a full reload
  const [items, setItems] = useState(assignments);
  const [cursor, setCursor] = useState<string | null>(nextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  // a refresh after posting sends a new list, so keep the copy (and its cursor) in step
  useEffect(() => {
    setItems(assignments);
    setCursor(nextCursor);
  }, [assignments, nextCursor]);
  const [filter, setFilter] = useState<DeskFilter>('all');
  // remembered between visits, so an editor who prefers rows keeps rows
  const [view, setView] = useLocalStorage<DeskView>('desk-assignment-view', 'comfort');
  // which assignment's "Review candidates" popup is open (none = undefined)
  const [reviewingId, setReviewingId] = useState<string | undefined>();

  const visible = rankBy(
    filterAssignments(items, filter).filter((a) => assignmentMatches(a, query)),
    query,
    assignmentRelevanceFields
  );
  const searching = query.trim().length > 0;
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();
  const reviewing = items.find((a) => a.id === reviewingId);
  const nameOf = (id?: string) => roster.find((m) => m.id === id)?.name;

  // save the choice first: a failed request must not look like a successful assignment
  const assign = async (assignmentId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!response.ok) throw new Error('assign failed');

      setItems((list) =>
        list.map((a) => (a.id === assignmentId ? { ...a, status: 'assigned', assignedToId: memberId } : a))
      );
      setReviewingId(undefined);
      showToast('Assigned. The freelancer now sees it on their desk.', 'success');
    } catch {
      // leave the popup open so the editor can try again or pick someone else
      showToast('Could not assign this freelancer. Please try again.', 'error');
    }
  };

  /** Fetch the next page; a failed request leaves the button to try again */
  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);

    try {
      const response = await fetch(`/api/assignments?after=${encodeURIComponent(cursor)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');

      const page = (await response.json()) as { items: DeskAssignment[]; nextCursor: string | null };
      setItems((list) => [...list, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      showToast('Could not load more assignments. Please try again.', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section aria-labelledby="assignments-heading">
      <div className={styles.sectionHead}>
        <h2 id="assignments-heading" className={styles.sectionTitle}>
          Assignments
        </h2>
        <div className={styles.sectionControls}>
          <SegmentedControl label="Assignment layout" options={VIEWS} value={view} onChange={setView} />
          <SegmentedControl label="Filter assignments" options={FILTERS} value={filter} onChange={setFilter} />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={styles.sectionSub}>
          {searching ? `No assignments match “${query.trim()}”.` : `No ${filterLabel} assignments.`}
        </p>
      ) : view === 'table' ? (
        <AssignmentsTable assignments={visible} assignedName={nameOf} onReview={setReviewingId} />
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

      {cursor && (
        <div className={styles.loadMoreRow}>
          <button type="button" className={styles.loadMore} onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
          {total !== undefined && (
            <span className={styles.loadMoreCount}>
              Showing {items.length} of {total}
            </span>
          )}
        </div>
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
