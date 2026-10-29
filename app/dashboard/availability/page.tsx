'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { Weekday } from '../../types/availability.types';
import type { AvailabilityStatus } from '../../types/dashboard.types';
import { Header } from '../../components/header/Header';
import styles from './availability.module.css';

const DAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
type Draft = {
  status: AvailabilityStatus;
  timezone: string;
  days: Weekday[];
  startsAt: string;
  endsAt: string;
};
const DEFAULT: Draft = {
  status: 'available',
  timezone: 'America/New_York',
  days: DAYS.slice(0, 5),
  startsAt: '09:00',
  endsAt: '17:00',
};

function validDraft(value: unknown): value is Draft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  if (
    !['available', 'busy', 'off'].includes(String(draft.status)) ||
    typeof draft.timezone !== 'string' ||
    !Array.isArray(draft.days) ||
    !draft.days.every((day) => DAYS.includes(day)) ||
    typeof draft.startsAt !== 'string' ||
    typeof draft.endsAt !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.startsAt) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.endsAt) ||
    draft.endsAt <= draft.startsAt ||
    (draft.status !== 'off' && draft.days.length === 0)
  )
    return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: draft.timezone });
    return true;
  } catch {
    return false;
  }
}

function AvailabilityForm({ userId }: { userId: string }) {
  const storageKey = `iij:availability:${userId}`;
  const [draft, setDraft] = useState<Draft>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (validDraft(parsed)) setDraft(parsed);
        else setError('Saved availability could not be loaded. Please enter it again.');
      }
    } catch {
      setError('Saved availability could not be loaded. Please enter it again.');
    }
    setReady(true);
  }, [storageKey]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setMessage('');
    setError('');
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    if (draft.endsAt <= draft.startsAt) {
      setError('End time must be later than start time. Choose a window within one day.');
      return;
    }
    if (draft.status !== 'off' && draft.days.length === 0) {
      setError('Choose at least one working day, or set your status to Off.');
      return;
    }
    const next = { ...draft, timezone: draft.timezone.trim() };
    if (!validDraft(next)) {
      setError('Enter a valid time zone, such as America/New_York or Europe/London.');
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setDraft(next);
      setError('');
      setMessage('Availability saved on this browser.');
    } catch {
      setError('Unable to save in this browser. Your changes have not been saved.');
    }
  };

  if (!ready) return <p role="status">Loading availability…</p>;

  return (
    <form onSubmit={save} className={styles.form}>
      <label className={styles.field}>
        Current status
        <select value={draft.status} onChange={(event) => update('status', event.target.value as AvailabilityStatus)}>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
          <option value="off">Off</option>
        </select>
      </label>
      <label className={styles.field}>
        Time zone
        <input
          required
          value={draft.timezone}
          placeholder="America/New_York"
          onChange={(event) => update('timezone', event.target.value)}
        />
      </label>
      <fieldset className={styles.days}>
        <legend>Typical working days</legend>
        {DAYS.map((day) => (
          <label key={day}>
            <input
              type="checkbox"
              checked={draft.days.includes(day)}
              onChange={() =>
                update(
                  'days',
                  draft.days.includes(day) ? draft.days.filter((value) => value !== day) : [...draft.days, day]
                )
              }
            />
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </label>
        ))}
      </fieldset>
      <div className={styles.times}>
        <label className={styles.field}>
          Start time
          <input
            type="time"
            required
            value={draft.startsAt}
            onChange={(event) => update('startsAt', event.target.value)}
          />
        </label>
        <label className={styles.field}>
          End time
          <input type="time" required value={draft.endsAt} onChange={(event) => update('endsAt', event.target.value)} />
        </label>
      </div>
      <p>Working times use your selected time zone. Choose a start and end within the same day.</p>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button type="submit" className={styles.save}>
        Save availability
      </button>
    </form>
  );
}

export default function AvailabilityPage() {
  const { userId, isLoaded } = useAuth();
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <h1>My availability</h1>
        <p>Set your current status and usual working hours.</p>
        <p>Saved only in this browser for your account. Editors cannot see these changes yet.</p>
        {!isLoaded ? (
          <p role="status">Loading account…</p>
        ) : userId ? (
          <AvailabilityForm key={userId} userId={userId} />
        ) : (
          <p>Please sign in to edit your availability.</p>
        )}
      </main>
    </div>
  );
}
