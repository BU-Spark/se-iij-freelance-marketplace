'use client';

import { useState } from 'react';
import Link from 'next/link';
import PitchListItem from '../../../components/PitchListItem/PitchListItem';
import PitchDetail from '../../../components/PitchDetail/PitchDetail';
import type { ArchivedPitch, PitchFeedback } from '../../../types/dashboard.types';
import desk from '../pitches.module.css';
import styles from './PitchArchive.module.css';

/** How a stored decision reads back to the editor who made it */
const DECISION_LABEL: Record<PitchFeedback['decision'], string> = {
  accepted: 'Accepted',
  rejected: 'Declined',
  revision_requested: 'Revision requested',
};

type PitchArchiveProps = {
  pitches: ArchivedPitch[];
};

/**
 * The desk's archive: the pitches the editor declined. It is read-only — deciding a pitch is what
 * moved it here — so there are no actions, only the pitch and the notes that went with it.
 */
export default function PitchArchive({ pitches }: PitchArchiveProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(pitches[0]?.id);
  const selected = pitches.find((p) => p.id === selectedId);

  return (
    <main className={desk.page}>
      <div className={desk.layout}>
        <section aria-labelledby="archive-heading">
          <Link href="/dashboard/pitches" className={styles.back}>
            ← Back to inbox
          </Link>
          <h1 id="archive-heading" className={desk.heading}>
            Archive
          </h1>
          <p className={styles.lede}>
            Pitches you declined. They stay here with your notes instead of cluttering the inbox.
          </p>

          {pitches.length === 0 ? (
            <p className={desk.empty}>No declined pitches yet.</p>
          ) : (
            <ul className={desk.list}>
              {pitches.map((pitch) => (
                <li key={pitch.id}>
                  <PitchListItem
                    pitch={pitch}
                    selected={pitch.id === selectedId}
                    onSelect={() => setSelectedId(pitch.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Archived pitch details" className={desk.detail}>
          {selected ? (
            <>
              <PitchDetail pitch={selected} />
              <section className={styles.decision} aria-label="Your decision">
                <h2 className={styles.decisionTitle}>
                  Your decision: {selected.feedback ? DECISION_LABEL[selected.feedback.decision] : 'Declined'}
                </h2>
                {selected.feedback ? (
                  <>
                    <p>{selected.feedback.comments}</p>
                    {selected.feedback.strengths && (
                      <p>
                        <strong>Strengths:</strong> {selected.feedback.strengths}
                      </p>
                    )}
                    {selected.feedback.improvements && (
                      <p>
                        <strong>Improvements:</strong> {selected.feedback.improvements}
                      </p>
                    )}
                  </>
                ) : (
                  <p>No notes were saved with this decision.</p>
                )}
              </section>
            </>
          ) : (
            <p className={desk.empty}>Select a pitch to read it.</p>
          )}
        </section>
      </div>
    </main>
  );
}
