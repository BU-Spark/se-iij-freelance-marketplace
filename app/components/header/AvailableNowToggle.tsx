'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './availableNowToggle.module.css';

type Saved = Record<string, unknown> & { availableNow?: unknown; timezone?: unknown; startsAt?: unknown };

const ENDPOINT = '/api/profile/availability?role=freelancer';

/**
 * The freelancer's "available now" switch, one click from any page.
 * The API saves the whole availability card at once, so the switch sends back what it loaded
 * with only `availableNow` flipped; the weekly hours are edited on the settings page.
 */
export default function AvailableNowToggle() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    // started inside a promise so any failure, even a missing fetch, just leaves the switch hidden
    Promise.resolve()
      .then(() => fetch(ENDPOINT))
      .then((res) => (res.ok ? res.json() : null))
      .then((body: Saved | null) => {
        if (!cancelled && body && typeof body === 'object') setSaved(body);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing to show until we know where they stand
  if (!saved) return null;

  // The API needs working hours before it saves the switch, so send them to set those first
  if (typeof saved.timezone !== 'string' || typeof saved.startsAt !== 'string') {
    return (
      <Link className={styles.toggle} href="/dashboard/settings">
        Set availability
      </Link>
    );
  }

  const on = saved.availableNow === true;

  const flip = async () => {
    setSaving(true);
    setError('');
    const next = { ...saved, role: 'freelancer', availableNow: !on };
    try {
      const res = await fetch('/api/profile/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error();
      setSaved(next);
    } catch {
      setError('Could not update your availability. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={`${styles.toggle} ${on ? styles.on : ''}`}
      disabled={saving}
      onClick={flip}
      title={error || (on ? 'Editors see you as available now' : 'Editors see you as away')}
    >
      <span className={styles.dot} aria-hidden="true" />
      {on ? 'Available now' : 'Away'}
      {error && (
        <span role="alert" className={styles.srOnly}>
          {error}
        </span>
      )}
    </button>
  );
}
