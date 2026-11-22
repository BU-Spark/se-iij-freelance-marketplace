'use client';

import { useState, type FormEvent } from 'react';
import { useToast } from '../../components/Toast/ToastProvider';
import type { Beat } from '../../types/admin.types';
import styles from '../admin.module.css';

/** Ask the admin API to add a beat; the server owns ordering and the duplicate check */
const saveBeat = async (name: string) => {
  const response = await fetch('/api/admin/beats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  const body = (await response.json().catch(() => null)) as { beat?: Beat; error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unable to add this beat right now.');
  }

  return body?.beat ?? null;
};

/** Ask the admin API to take a beat out of the onboarding picker */
const deleteBeat = async (beat: Beat) => {
  const response = await fetch(`/api/admin/beats/${beat.id}`, { method: 'DELETE' });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    throw new Error(body?.error ?? 'Unable to remove this beat right now.');
  }
};

/** Add beats to the onboarding picker, or take one away so it is no longer offered */
export default function BeatList({ beats }: { beats: Beat[] }) {
  const [items, setItems] = useState(beats);
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const { showToast } = useToast();

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (!trimmed || adding) return;

    setAdding(true);

    try {
      const beat = await saveBeat(trimmed);

      if (!beat) {
        showToast('Unable to add this beat right now.', 'error');
        return;
      }

      setItems((list) => [...list, beat]);
      setName('');
      showToast(`${beat.name} is now offered during onboarding.`);
    } catch (error) {
      console.error('Could not add the beat.', error);
      showToast(error instanceof Error ? error.message : 'Unable to add this beat right now.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const remove = async (beat: Beat) => {
    setRemoving(beat.id);

    try {
      await deleteBeat(beat);
      setItems((list) => list.filter((item) => item.id !== beat.id));
      showToast(`${beat.name} is no longer offered. People who already picked it keep it.`, 'info');
    } catch (error) {
      console.error('Could not remove the beat.', error);
      showToast(error instanceof Error ? error.message : 'Unable to remove this beat right now.', 'error');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section>
      <form className={styles.beatForm} onSubmit={add}>
        <label htmlFor="new-beat">
          Add a beat
          <input
            id="new-beat"
            value={name}
            maxLength={60}
            placeholder="e.g. Water rights"
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button type="submit" className={`${styles.action} ${styles.primaryAction}`} disabled={adding || !name.trim()}>
          {adding ? 'Adding…' : 'Add beat'}
        </button>
      </form>

      {items.length === 0 ? (
        <p className={styles.emptyCard}>
          <strong>No beats yet</strong>
          Add one above and it appears in onboarding straight away.
        </p>
      ) : (
        <>
          <p className={styles.hint}>
            Freelancers pick from this list during onboarding. Removing a beat only stops it being offered — anyone who
            already picked it keeps it on their profile.
          </p>

          <ul className={styles.list}>
            {items.map((beat) => (
              <li key={beat.id} className={styles.row}>
                <div className={styles.rowTop}>
                  <h2 className={styles.rowTitle}>{beat.name}</h2>
                  <div className={styles.actions} role="group" aria-label={`Actions for ${beat.name}`}>
                    <button
                      type="button"
                      className={`${styles.action} ${styles.dangerAction}`}
                      disabled={removing === beat.id}
                      onClick={() => remove(beat)}
                    >
                      {removing === beat.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
