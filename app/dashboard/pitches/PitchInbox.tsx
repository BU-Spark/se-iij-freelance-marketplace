'use client';

import { useState } from 'react';
import PitchListItem from '../../components/PitchListItem/PitchListItem';
import PitchDetail from '../../components/PitchDetail/PitchDetail';
import type { Pitch } from '../../types/dashboard.types';
import styles from './pitches.module.css';

type PitchInboxProps = {
  pitches: Pitch[];
};

export default function PitchInbox({ pitches }: PitchInboxProps) {
  // the pitch open on the right; starts with the first one
  const [selectedId, setSelectedId] = useState(pitches[0]?.id);
  const selected = pitches.find((p) => p.id === selectedId);
  const newCount = pitches.filter((p) => p.status === 'new').length;

  return (
    <main className={styles.layout}>
      <section aria-labelledby="inbox-heading" className={styles.inbox}>
        <div className={styles.inboxHead}>
          <h1 id="inbox-heading" className={styles.heading}>
            Inbox
          </h1>
          <p className={styles.sub}>
            {newCount} new · {pitches.length} total
          </p>
        </div>

        <ul className={styles.list}>
          {pitches.map((p) => (
            <li key={p.id}>
              <PitchListItem pitch={p} selected={p.id === selectedId} onSelect={() => setSelectedId(p.id)} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Pitch details" className={styles.detail}>
        {selected ? <PitchDetail pitch={selected} /> : <p className={styles.empty}>Select a pitch to read it.</p>}
      </section>
    </main>
  );
}
