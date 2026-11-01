'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { PitchDraft, PitchFormErrors } from '../../types/pitchForm.types';
import { PitchForm } from './PitchForm';
import { PitchPreview } from './PitchPreview';
import { EMPTY_PITCH, isPitchDraft, validatePitch } from './pitchForm.utils';

function AccountPitchComposer({ userId }: { userId: string }) {
  const key = `iij:pitch-draft:${userId}`;
  const [draft, setDraft] = useState<PitchDraft>(EMPTY_PITCH);
  const [errors, setErrors] = useState<PitchFormErrors>({});
  const [ready, setReady] = useState(false);
  const [reviewing, setReviewing] = useState(false);
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
  const save = () => {
    setMessage('');
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setError('');
      setMessage('Draft saved in this browser. No pitch or invitations have been sent.');
    } catch {
      setError('Unable to save your draft in this browser. Your changes remain in the form.');
    }
  };
  const review = () => {
    const nextErrors = validatePitch(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setError('Please correct the highlighted fields before reviewing.');
      return;
    }
    setError('');
    setMessage('');
    setReviewing(true);
  };
  if (!ready) return <p role="status">Loading draft…</p>;
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {reviewing ? (
        <PitchPreview
          draft={draft}
          onEdit={() => {
            setReviewing(false);
            setMessage('');
          }}
          onSaveDraft={save}
        />
      ) : (
        <PitchForm
          draft={draft}
          errors={errors}
          onChange={(patch) => {
            setDraft((previous) => ({ ...previous, ...patch }));
            setMessage('');
          }}
          onReview={review}
          onSaveDraft={save}
        />
      )}
    </>
  );
}
export function PitchComposer() {
  const { userId, isLoaded } = useAuth();
  if (!isLoaded) return <p role="status">Loading account…</p>;
  if (!userId) return <p>Please sign in to create a pitch.</p>;
  return <AccountPitchComposer key={userId} userId={userId} />;
}
