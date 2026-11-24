'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Pitch, PitchStatus } from '../../../../types/dashboard.types';
import SegmentedControl, { type SegmentOption } from '../../../components/SegmentedControl';
import { PITCH_STATUS_LABEL } from '../../../pitches/constants';
import { categoryColor } from '../../../../utils/category.utils';
import { timeAgo } from '../../../../utils/dashboard.utils';
import { pitchHeading } from '../../../../utils/pitch.utils';
import styles from '../myPitches.module.css';
import listStyles from './MyPitchesList.module.css';

export type PitchFilter = 'all' | PitchStatus;

const STATUS_ORDER: PitchStatus[] = ['new', 'reviewed', 'negotiating', 'accepted', 'declined'];

/** "All (5)" plus one segment per status the freelancer actually has, so empty tabs never show */
export function pitchFilterOptions(pitches: Pitch[]): SegmentOption<PitchFilter>[] {
  const count = (status: PitchStatus) => pitches.filter((pitch) => pitch.status === status).length;
  return [
    { value: 'all', label: `All (${pitches.length})` },
    ...STATUS_ORDER.filter((status) => count(status) > 0).map((status) => ({
      value: status,
      label: `${PITCH_STATUS_LABEL[status]} (${count(status)})`,
    })),
  ];
}

/** The freelancer's sent pitches, filterable by where each one is in the editor's review */
export default function MyPitchesList({ pitches }: { pitches: Pitch[] }) {
  const [filter, setFilter] = useState<PitchFilter>('all');
  const shown = filter === 'all' ? pitches : pitches.filter((pitch) => pitch.status === filter);
  const negotiating = pitches.filter((pitch) => pitch.status === 'negotiating').length;

  return (
    <>
      {negotiating > 0 && (
        <p className={listStyles.attention} role="status">
          {negotiating === 1 ? '1 pitch needs' : `${negotiating} pitches need`} your reply: the editor proposed changes.{' '}
          <button type="button" className={listStyles.link} onClick={() => setFilter('negotiating')}>
            Show {negotiating === 1 ? 'it' : 'them'}
          </button>
        </p>
      )}

      <div className={listStyles.toolbar}>
        <SegmentedControl
          label="Filter pitches by status"
          options={pitchFilterOptions(pitches)}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <ul className={styles.list}>
        {shown.map((pitch) => (
          <li key={pitch.id}>
            <Link href={`/dashboard/freelancer/pitches/${pitch.id}`} className={styles.card}>
              <span className={styles.top}>
                <span className={styles.category}>
                  <span
                    className={styles.dot}
                    style={{ background: categoryColor(pitch.category) }}
                    aria-hidden="true"
                  />
                  {pitch.category}
                </span>
                <span className={`${styles.pill} ${styles[pitch.status]}`}>{PITCH_STATUS_LABEL[pitch.status]}</span>
              </span>
              <span className={styles.pitchTitle}>{pitchHeading(pitch.slug)}</span>
              <span className={styles.summary}>{pitch.summary}</span>
              <span className={styles.footer}>
                <span className={styles.meta}>Submitted {timeAgo(pitch.submittedAt)}</span>
                <span className={styles.more}>View pitch and feedback →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {/* a refresh can move the last pitch out of the chosen status */}
      {shown.length === 0 && <p className={styles.panel}>No pitches with this status right now.</p>}
    </>
  );
}
