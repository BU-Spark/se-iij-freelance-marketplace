'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { PitchDraft, PitchFormErrors } from '../../types/pitchForm.types';
import { PitchForm } from './PitchForm';
import styles from './PitchForm.module.css';
import { EMPTY_PITCH, isPitchDraft, validatePitch } from './pitchForm.utils';

function AccountPitchComposer({ userId }: { userId: string }) {
  const key = `iij:pitch-draft:${userId}`;
  const [draft, setDraft] = useState<PitchDraft>(EMPTY_PITCH);
  const [errors, setErrors] = useState<PitchFormErrors>({});
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isPitchDraft(parsed)) throw new Error('Invalid draft');
        setDraft(parsed);
      }
    } catch {
      setError('Your saved draft could not be loaded. You can start a new draft.');
    }
    setReady(true);
  }, [key]);

  // the draft saves itself in this browser on every change
  const update = (patch: Partial<PitchDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    setMessage('');
    setErrors((current) => {
      const touched = Object.keys(patch) as Array<keyof PitchDraft>;
      if (!touched.some((field) => current[field])) return current;
      const rest = { ...current };
      touched.forEach((field) => delete rest[field]);
      return rest;
    });
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setError('');
    } catch {
      setError('Unable to save your draft in this browser. Your changes remain in the form.');
    }
  };

  const send = () => {
    const nextErrors = validatePitch(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage('');
      setError('Please correct the highlighted fields before sending.');
      return;
    }
    // TODO: POST to the pitches API once it exists
    setError('');
    setMessage('Your pitch is saved in this browser. Sending to editors is not connected yet.');
  };

  if (!ready) return <p role="status">Loading draft…</p>;
  return (
    <>
      <PitchForm
        draft={draft}
        errors={errors}
        onChange={update}
        onSend={send}
        notice={
          <>
            {error && (
              <p role="alert" className={styles.alert}>
                {error}
              </p>
            )}
            {message && <p role="status">{message}</p>}
          </>
        }
      />
    </>
  );
}

export function PitchComposer() {
  const { userId, isLoaded } = useAuth();
  if (!isLoaded) return <p role="status">Loading account…</p>;
  if (!userId) return <p>Please sign in to create a pitch.</p>;
  return <AccountPitchComposer key={userId} userId={userId} />;
}
