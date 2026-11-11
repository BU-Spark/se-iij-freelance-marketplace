'use client';

import { useState } from 'react';
import SegmentedControl, { type SegmentOption } from '../components/SegmentedControl';
import PitchListItem from '../../components/PitchListItem/PitchListItem';
import PitchDetail from '../../components/PitchDetail/PitchDetail';
import PitchActions from '../../components/PitchActions/PitchActions';
import type { Pitch, PitchFeedback, PitchFilter, PitchStatus } from '../../types/dashboard.types';
import styles from './pitches.module.css';

const FILTERS: SegmentOption<PitchFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

/** true if the pitch should show under this tab */
const matches = (p: Pitch, filter: PitchFilter) => filter === 'all' || p.status === filter;

type PitchInboxProps = {
  pitches: Pitch[];
};

export default function PitchInbox({ pitches }: PitchInboxProps) {
  // our own copy of the pitches, so we can change their status on screen
  // TODO: save status changes to the backend once the API exists
  const [items, setItems] = useState(pitches);
  const [feedbackByPitch, setFeedbackByPitch] = useState<Record<string, PitchFeedback[]>>({});
  const [filter, setFilter] = useState<PitchFilter>('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(pitches[0]?.id);

  const visible = items.filter((p) => matches(p, filter));
  // look in all items, so the open pitch stays open even if its new status hides it from this tab
  const selected = items.find((p) => p.id === selectedId);
  const newCount = items.filter((p) => p.status === 'new').length;
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();

  // switch tab and open the first pitch in it
  const changeFilter = (next: PitchFilter) => {
    setFilter(next);
    setSelectedId(items.find((p) => matches(p, next))?.id);
  };

  // change one pitch's status and keep all the others the same
  const setStatus = (id: string, status: PitchStatus) =>
    setItems((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));

  return (
    <main className={styles.page}>
      {/* summary + status tabs */}
      <div className={styles.bar}>
        <p className={styles.summary}>
          <strong>{items.length} pitches</strong> on the desk · <span className={styles.newCount}>{newCount} new</span>
        </p>
        <SegmentedControl label="Filter pitches" options={FILTERS} value={filter} onChange={changeFilter} />
      </div>

      <div className={styles.layout}>
        <section aria-labelledby="inbox-heading">
          <h1 id="inbox-heading" className={styles.heading}>
            Inbox
          </h1>

          {visible.length === 0 ? (
            <p className={styles.empty}>No {filterLabel} pitches.</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((p) => (
                <li key={p.id}>
                  <PitchListItem pitch={p} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Pitch details" className={styles.detail}>
          {selected ? (
            <>
              <PitchDetail pitch={selected} />
              <PitchActions
                key={selected.id}
                status={selected.status}
                freelancerName={selected.freelancer.name}
                feedbackHistory={feedbackByPitch[selected.id] ?? []}
                onChange={(status) => setStatus(selected.id, status)}
                onSubmitFeedback={(feedback) =>
                  setFeedbackByPitch((saved) => ({
                    ...saved,
                    [selected.id]: [
                      { ...feedback, submittedBy: 'You', submittedAt: new Date() },
                      ...(saved[selected.id] ?? []),
                    ],
                  }))
                }
              />
            </>
          ) : (
            <p className={styles.empty}>Select a pitch to read it.</p>
          )}
        </section>
      </div>
    </main>
  );
}
