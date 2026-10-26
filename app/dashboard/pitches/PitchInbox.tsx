'use client';

import { useState } from 'react';
import PitchListItem from '../../components/PitchListItem/PitchListItem';
import PitchDetail from '../../components/PitchDetail/PitchDetail';
import PitchActions from '../../components/PitchActions/PitchActions';
import type { Pitch, PitchStatus } from '../../types/dashboard.types';
import styles from './pitches.module.css';

type PitchInboxProps = {
  pitches: Pitch[];
};

export default function PitchInbox({ pitches }: PitchInboxProps) {
  // our own copy of the pitches, so we can change their status on screen
  // TODO: save status changes to the backend once the API exists
  const [items, setItems] = useState(pitches);

  // the pitch open on the right; starts with the first one
  const [selectedId, setSelectedId] = useState(pitches[0]?.id);
  const selected = items.find((p) => p.id === selectedId);
  const newCount = items.filter((p) => p.status === 'new').length;

  // change one pitch's status and keep all the others the same
  const setStatus = (id: string, status: PitchStatus) =>
    setItems((list) => list.map((p) => (p.id === id ? { ...p, status } : p)));

  return (
    <main className={styles.layout}>
      <section aria-labelledby="inbox-heading" className={styles.inbox}>
        <div className={styles.inboxHead}>
          <h1 id="inbox-heading" className={styles.heading}>
            Inbox
          </h1>
          <p className={styles.sub}>
            {newCount} new · {items.length} total
          </p>
        </div>

        <ul className={styles.list}>
          {items.map((p) => (
            <li key={p.id}>
              <PitchListItem pitch={p} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Pitch details" className={styles.detail}>
        {selected ? (
          <>
            <PitchDetail pitch={selected} />
            <PitchActions
              status={selected.status}
              freelancerName={selected.freelancer.name}
              onChange={(status) => setStatus(selected.id, status)}
            />
          </>
        ) : (
          <p className={styles.empty}>Select a pitch to read it.</p>
        )}
      </section>
    </main>
  );
}
