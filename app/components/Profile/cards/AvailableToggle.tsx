'use client';

import { useEffect, useState } from 'react';
import FreeNowTimer from '../../Availability/FreeNowTimer';
import { DEFAULT_FREE_NOW_PRESET, freeNowExpiry, isFreeNow } from '../../../utils/availability.utils';
import styles from '../Profile.module.css';

type AvailableToggleProps = {
  availableNow: boolean;
  /** ISO instant the flag stops at; null when it has no timer */
  availableUntil?: string | null;
  onToggle: (availableNow: boolean, availableUntil: string | null) => void;
};

/** The timer can run out while the panel is open, so the switch re-reads the clock this often */
const TICK_MS = 30_000;

export default function AvailableToggle({ availableNow, availableUntil = null, onToggle }: AvailableToggleProps) {
  const [now, setNow] = useState(() => new Date());
  // the picker shows the choice straight away, while only a finished choice is saved
  const [until, setUntil] = useState<string | null>(availableUntil);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // a save elsewhere (or a refused one) changes the real value, so follow it
  useEffect(() => setUntil(availableUntil), [availableUntil]);

  const freeNow = isFreeNow(availableNow, until, now);

  const toggle = () => {
    if (freeNow) {
      setUntil(null);
      onToggle(false, null);
      return;
    }

    // switching on starts at the end of today; the picker below can shorten or move that
    const expiry = freeNowExpiry(DEFAULT_FREE_NOW_PRESET, new Date())?.toISOString() ?? null;
    setUntil(expiry);
    onToggle(true, expiry);
  };

  return (
    <div className={styles.availableBlock}>
      <button type="button" role="switch" aria-checked={freeNow} className={styles.availableToggle} onClick={toggle}>
        <span className={styles.availableText}>
          <span className={styles.availableTitle}>Free right now</span>
          <span className={styles.availableHint}>
            {freeNow ? 'Editors see you as available' : 'Turn on to show editors you can take work'}
          </span>
        </span>
        <span className={styles.availableTrack} data-on={freeNow} aria-hidden="true">
          <span className={styles.availableThumb} />
        </span>
      </button>

      {freeNow && (
        <div className={styles.availableTimer}>
          <FreeNowTimer availableUntil={until} onChange={setUntil} onCommit={(next) => onToggle(true, next)} />
        </div>
      )}
    </div>
  );
}
