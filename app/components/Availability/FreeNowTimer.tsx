'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_FREE_NOW_PRESET,
  FREE_NOW_PRESETS,
  freeNowExpiry,
  freeNowPresetOf,
  freeUntilLabel,
  fromDateTimeInput,
  MAX_FREE_NOW_HOURS,
  toDateTimeInput,
  type FreeNowPreset,
} from '../../utils/availability.utils';
import styles from './availability.module.css';

type FreeNowTimerProps = {
  /** ISO instant the flag stops at; null when it has no timer yet */
  availableUntil: string | null;
  /** called as the person edits the expiry, which may not be a finished choice yet */
  onChange: (availableUntil: string) => void;
  /** called once the choice is finished, so parents that save as they go do not save on every keystroke */
  onCommit?: (availableUntil: string) => void;
};

/** The expiry picker behind "free right now": a few presets, or a time of the person's own */
export default function FreeNowTimer({ availableUntil, onChange, onCommit }: FreeNowTimerProps) {
  const [preset, setPreset] = useState<FreeNowPreset>(() => freeNowPresetOf(availableUntil));
  const [custom, setCustom] = useState(() => {
    const fallback = freeNowExpiry(DEFAULT_FREE_NOW_PRESET, new Date());
    return toDateTimeInput(availableUntil ?? fallback?.toISOString() ?? '');
  });

  // a save elsewhere can change the timer underneath the picker, so follow the saved value
  useEffect(() => {
    setPreset(freeNowPresetOf(availableUntil));
    if (availableUntil) setCustom(toDateTimeInput(availableUntil));
  }, [availableUntil]);

  const choosePreset = (next: FreeNowPreset) => {
    setPreset(next);

    const expiry = freeNowExpiry(next, new Date());
    if (!expiry) return;

    const iso = expiry.toISOString();
    onChange(iso);
    onCommit?.(iso);
  };

  const chooseCustom = (value: string) => {
    setCustom(value);

    const iso = fromDateTimeInput(value);
    if (iso) onChange(iso);
  };

  // the custom field changes on every segment, so only the finished value is worth saving
  const commitCustom = () => {
    const iso = fromDateTimeInput(custom);
    if (iso) onCommit?.(iso);
  };

  const until = availableUntil ? new Date(availableUntil) : null;
  const running = Boolean(until && until.getTime() > Date.now());

  return (
    <div className={styles.timer}>
      <label className={styles.field}>
        Free for
        <select value={preset} onChange={(event) => choosePreset(event.target.value as FreeNowPreset)}>
          {FREE_NOW_PRESETS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {preset === 'custom' && (
        <label className={styles.field}>
          Stops at
          <input
            type="datetime-local"
            value={custom}
            min={toDateTimeInput(new Date().toISOString())}
            max={toDateTimeInput(new Date(Date.now() + MAX_FREE_NOW_HOURS * 3_600_000).toISOString())}
            onChange={(event) => chooseCustom(event.target.value)}
            onBlur={commitCustom}
          />
        </label>
      )}

      <p className={styles.timerHint} role="status">
        {running && until
          ? `The timer turns this off at ${freeUntilLabel(until)}.`
          : 'Pick a time in the future for the timer.'}
      </p>
    </div>
  );
}
