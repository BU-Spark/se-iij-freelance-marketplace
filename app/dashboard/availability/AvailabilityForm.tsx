'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { Weekday } from '../../types/availability.types';
import styles from './availability.module.css';

const DAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type Draft = {
  /** the "free right now" switch, which editors see immediately */
  freeNow: boolean;
  timezone: string;
  days: Weekday[];
  startsAt: string;
  endsAt: string;
};

/** The browser's own zone is a better guess than any fixed one */
const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

const DEFAULT: Draft = {
  freeNow: false,
  timezone: browserTimeZone(),
  days: DAYS.slice(0, 5),
  startsAt: '09:00',
  endsAt: '17:00',
};

const isTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

/** What the API sent, as a draft; anything unusable falls back to the defaults */
const toDraft = (body: Record<string, unknown>): Draft => {
  const days = Array.isArray(body.days) ? body.days.filter((day): day is string => typeof day === 'string') : null;

  return {
    freeNow: body.availableNow === true,
    timezone: typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone : DEFAULT.timezone,
    days: days ? DAYS.filter((day) => days.includes(day)) : DEFAULT.days,
    startsAt: typeof body.startsAt === 'string' ? body.startsAt : DEFAULT.startsAt,
    endsAt: typeof body.endsAt === 'string' ? body.endsAt : DEFAULT.endsAt,
  };
};

/** Saves through the profile API, so editors and freelancers see the same hours the person set */
export default function AvailabilityForm({ userId }: { userId: string }) {
  const [draft, setDraft] = useState<Draft>(DEFAULT);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setMessage('');
    setError('');

    (async () => {
      try {
        const response = await fetch('/api/profile/availability', { cache: 'no-store' });
        if (cancelled) return;

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error ?? 'Saved availability could not be loaded. Please enter it again.');
          return;
        }

        const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (body) setDraft(toDraft(body));
      } catch {
        if (!cancelled) setError('Saved availability could not be loaded. Please enter it again.');
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setMessage('');
    setError('');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const timezone = draft.timezone.trim();

    if (draft.endsAt <= draft.startsAt) {
      setError('End time must be later than start time. Choose a window within one day.');
      return;
    }

    if (draft.days.length === 0 && !draft.freeNow) {
      setError('Choose at least one working day, or say you are free right now.');
      return;
    }

    if (!isTimeZone(timezone)) {
      setError('Enter a valid time zone, such as America/New_York or Europe/London.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableNow: draft.freeNow,
          timezone,
          days: draft.days,
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
        }),
      });

      const body = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(body?.error ?? 'Unable to save your availability right now.');
        return;
      }

      setDraft((previous) => ({ ...previous, timezone }));
      setMessage('Availability saved. Editors can see when you are free.');
    } catch {
      setError('Unable to save your availability right now.');
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <p role="status">Loading availability…</p>;

  return (
    <form onSubmit={save} className={styles.form}>
      <label className={styles.check}>
        <input type="checkbox" checked={draft.freeNow} onChange={(event) => update('freeNow', event.target.checked)} />
        <span>I&apos;m free right now</span>
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
      <button type="submit" className={styles.save} disabled={saving}>
        {saving ? 'Saving…' : 'Save availability'}
      </button>
    </form>
  );
}
