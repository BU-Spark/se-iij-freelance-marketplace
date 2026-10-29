'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Header } from '../../components/header/Header';
import { PreviewCard } from '../../components';
import ProfileStep, { type Touched } from '../../onboarding/steps/ProfileStep';
import { EMPTY } from '../../onboarding/constants';
import { validateProfile } from '../../utils/validation.utils';
import type { ProfileData } from '../../types/onboarding.types';
import styles from './profile.module.css';

/** Validate browser data before passing it to the shared form and preview. */
function isProfileData(value: unknown): value is ProfileData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const strings = ['firstName', 'lastName', 'email', 'shortBio', 'jobTitle', 'organizationId', 'location'];
  const lists = ['desks', 'reportingBeats', 'workMediums', 'tools'];
  return (
    strings.every((key) => typeof data[key] === 'string') &&
    lists.every((key) => Array.isArray(data[key]) && data[key].every((item: unknown) => typeof item === 'string')) &&
    typeof data.yearsAtDesk === 'number' &&
    Array.isArray(data.portfolio) &&
    data.portfolio.every((item: unknown) => {
      if (!item || typeof item !== 'object') return false;
      const clip = item as Record<string, unknown>;
      return ['id', 'type', 'title', 'url'].every((key) => typeof clip[key] === 'string');
    })
  );
}

function MyProfile({ userId }: { userId: string }) {
  const storageKey = `iij:profile:${userId}`;
  const [saved, setSaved] = useState<ProfileData | null>(null);
  const [draft, setDraft] = useState<ProfileData>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState<Touched>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const errors = validateProfile('freelancer', draft);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const value: unknown = JSON.parse(stored);
        if (!isProfileData(value) || Object.keys(validateProfile('freelancer', value)).length > 0) {
          throw new Error('Invalid saved profile');
        }
        setSaved(value);
        setDraft(value);
      }
    } catch {
      setError('Your browser profile could not be loaded. You can enter your details again.');
    }
    setReady(true);
  }, [storageKey]);

  const beginEdit = () => {
    setDraft(saved ?? EMPTY);
    setTouched({});
    setError(null);
    setMessage('');
    setEditing(true);
  };

  const save = () => {
    setTouched(Object.fromEntries(Object.keys(errors).map((key) => [key, true])));
    if (Object.keys(errors).length > 0) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setSaved(draft);
      setEditing(false);
      setError(null);
      setMessage('Profile saved on this browser.');
    } catch {
      setError('Unable to save in this browser. Your changes have not been saved.');
    }
  };

  if (!ready) return <p role="status">Loading profile…</p>;

  if (editing)
    return (
      <ProfileStep
        mode="edit"
        role="freelancer"
        data={draft}
        orgs={[]}
        errors={errors}
        touched={touched}
        shake={false}
        submitting={false}
        update={(key, value) => {
          setDraft((previous) => ({ ...previous, [key]: value }));
          setError(null);
        }}
        touch={(key) => setTouched((previous) => ({ ...previous, [key]: true }))}
        addOrg={() => {}}
        onBack={() => {
          setEditing(false);
          setError(null);
        }}
        onSubmit={save}
        submitError={error}
      />
    );

  return (
    <>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {saved ? (
        <section aria-label="Your profile" className={styles.details}>
          <PreviewCard role="freelancer" data={saved} />
          <dl>
            <dt>Email</dt>
            <dd>{saved.email}</dd>
            <dt>Tools</dt>
            <dd>{saved.tools.join(', ') || 'No tools added'}</dd>
            <dt>Portfolio</dt>
            <dd>
              {saved.portfolio.length
                ? saved.portfolio.map((clip) => (
                    <p key={clip.id}>
                      <a href={clip.url} target="_blank" rel="noopener noreferrer">
                        {clip.title}
                      </a>
                    </p>
                  ))
                : 'No portfolio link added'}
            </dd>
          </dl>
        </section>
      ) : (
        <p>No profile is saved in this browser yet. Add your freelancer details to get started.</p>
      )}
      <button type="button" className={styles.edit} onClick={beginEdit}>
        {saved ? 'Edit profile' : 'Add profile details'}
      </button>
    </>
  );
}

export default function ProfilePage() {
  const { userId, isLoaded } = useAuth();
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <h1>My profile</h1>
        <p>Manage your freelancer details, specialties, and portfolio.</p>
        <p>
          Saved only in this browser for your account. Your onboarding profile is not loaded here yet, and edits are not
          published to editors.
        </p>
        {!isLoaded ? (
          <p role="status">Loading account…</p>
        ) : userId ? (
          <MyProfile key={userId} userId={userId} />
        ) : (
          <p>Please sign in to view your profile.</p>
        )}
      </main>
    </div>
  );
}
