'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
];

/**
 * true if the pitch shows under this tab. Declined pitches are never in the inbox — they live in
 * the archive — so "All" means everything still on the desk.
 */
const matches = (p: Pitch, filter: PitchFilter) => (filter === 'all' ? p.status !== 'declined' : p.status === filter);

type PitchInboxProps = {
  pitches: Pitch[];
};

/** What a review sends: feedback carries the decision, a plain status just moves the pitch */
type PitchUpdate = { status: PitchStatus } | { feedback: PitchFeedback };

export default function PitchInbox({ pitches }: PitchInboxProps) {
  // our own copy of the pitches, so a saved review can move them without a reload
  const [items, setItems] = useState(pitches);
  const [feedbackByPitch, setFeedbackByPitch] = useState<Record<string, PitchFeedback>>({});
  const [filter, setFilter] = useState<PitchFilter>('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(pitches[0]?.id);
  const [error, setError] = useState('');

  const visible = items.filter((p) => matches(p, filter));
  // look in all items, so the open pitch stays open even if its new status hides it from this tab
  const selected = items.find((p) => p.id === selectedId);
  // declined pitches have left for the archive, so they don't count towards the desk
  const onDesk = items.filter((p) => p.status !== 'declined');
  const newCount = onDesk.filter((p) => p.status === 'new').length;
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();

  // switch tab and open the first pitch in it
  const changeFilter = (next: PitchFilter) => {
    setFilter(next);
    setSelectedId(items.find((p) => matches(p, next))?.id);
  };

  // Save on the desk, then move the pitch on screen to the status the API reports.
  // Background changes (opening a pitch) stay quiet so a lagging request never shouts on screen.
  const save = async (id: string, update: PitchUpdate, { quiet = false } = {}) => {
    if (!quiet) setError('');
    try {
      const response = await fetch(`/api/pitches/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (!response.ok) throw new Error(`The review could not be saved (${response.status}).`);

      const { status } = (await response.json()) as { status: PitchStatus };
      setItems((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));
      if ('feedback' in update) setFeedbackByPitch((saved) => ({ ...saved, [id]: update.feedback }));
    } catch (cause) {
      console.error('Failed to save a pitch review.', cause);
      if (!quiet) setError('Your review could not be saved. Check your connection and try again.');
    }
  };

  // Opening a pitch the editor has not seen yet is what "reviewed" means: read, nothing decided.
  // A decision (negotiate / accept / decline) moves it on from there.
  useEffect(() => {
    if (selected && selected.status === 'new') {
      void save(selected.id, { status: 'reviewed' }, { quiet: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the open pitch changes
  }, [selected?.id, selected?.status]);

  return (
    <main className={styles.page}>
      {/* summary + status tabs */}
      <div className={styles.bar}>
        <p className={styles.summary}>
          <strong>{onDesk.length} pitches</strong> on the desk · <span className={styles.newCount}>{newCount} new</span>
        </p>
        <div className={styles.barActions}>
          <SegmentedControl label="Filter pitches" options={FILTERS} value={filter} onChange={changeFilter} />
          <Link href="/dashboard/pitches/archive" className={styles.archiveLink}>
            Archive →
          </Link>
        </div>
      </div>

      {error && (
        <p role="alert" className={styles.empty}>
          {error}
        </p>
      )}

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
              {selected.status === 'declined' && (
                <p className={styles.archivedNote}>
                  This pitch is in the <Link href="/dashboard/pitches/archive">archive</Link>. Choosing another action
                  moves it back to the inbox.
                </p>
              )}
              <PitchActions
                key={selected.id}
                status={selected.status}
                freelancerName={selected.freelancer.name}
                savedFeedback={feedbackByPitch[selected.id]}
                onSubmitFeedback={(feedback) => void save(selected.id, { feedback })}
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
