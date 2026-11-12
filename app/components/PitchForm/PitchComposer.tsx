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
  const [sending, setSending] = useState(false);

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

  // Sending hands the draft to the API, which re-runs the same validation and resolves the editor
  const send = async () => {
    if (sending) return;

    const nextErrors = validatePitch(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage('');
      setError('Please correct the highlighted fields before sending.');
      return;
    }

    setSending(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      if (response.status === 400) {
        const body = (await response.json()) as { error?: string; errors?: PitchFormErrors };
        if (body.errors) setErrors(body.errors);
        setError(body.error ?? 'Please correct the highlighted fields before sending.');
        return;
      }

      if (response.status === 409) {
        setError('You have already sent this pitch to that editor.');
        return;
      }

      if (!response.ok) throw new Error(`The pitch could not be sent (${response.status}).`);

      // Only forget the draft once the desk actually has it
      localStorage.removeItem(key);
      setMessage('Pitch sent. The editor will see it in their inbox.');
    } catch (cause) {
      console.error('Failed to send a pitch.', cause);
      setError('Your pitch could not be sent. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  if (!ready) return <p role="status">Loading draft…</p>;
  return (
    <>
      <PitchForm
        draft={draft}
        errors={errors}
        onChange={update}
        onSend={() => void send()}
        sending={sending}
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
