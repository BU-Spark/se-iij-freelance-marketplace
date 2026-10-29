'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IIJLogo } from '../components';
import styles from './onboarding.module.css';
import { DEFAULT_ORGS, EMPTY, PROFILE_STEP_FIELDS } from './constants';
import type { OnboardingRole, OrgOption, ProfileData, Step, Touched } from '../types/onboarding.types';
import { validateProfile } from '../utils/validation.utils';
import RoleStep from './steps/RoleStep';
import DoneStep from './steps/DoneStep';
import EditorProfileStep from './steps/editor/EditorProfileStep';
import EditorPreferencesStep from './steps/editor/EditorPreferencesStep';
import FreelancerProfileStep from './steps/freelancer/FreelancerProfileStep';
import FreelancerPreferencesStep from './steps/freelancer/FreelancerPreferencesStep';
import { detectTimezone, toProfile } from '../utils/profile.utils';

const PROGRESS: Record<Step, number> = { role: 25, profile: 50, preferences: 75, done: 100 };

/** Each role names its own steps, so the header reads like the flow the user is actually in */
const STEP_LABELS: Record<OnboardingRole, Record<'profile' | 'preferences', string>> = {
  editor: {
    profile: 'Step 2 of 3 — Your newsroom',
    preferences: 'Step 3 of 3 — How you work',
  },
  freelancer: {
    profile: 'Step 2 of 3 — Your reporting',
    preferences: 'Step 3 of 3 — Rates & availability',
  },
};

const stepLabel = (step: Step, role: OnboardingRole | null) => {
  if (step === 'role') return 'Step 1 of 3 — Who are you?';
  if (step === 'done') return 'All done';
  return STEP_LABELS[role ?? 'editor'][step];
};

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<OnboardingRole | null>(null);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [orgs, setOrgs] = useState<OrgOption[]>(DEFAULT_ORGS);
  const [touched, setTouched] = useState<Touched>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seeded in an effect so the server and first client render agree on the value
  useEffect(() => {
    setData((d) => (d.timezone ? d : { ...d, timezone: detectTimezone() }));
  }, []);

  const errors = useMemo(() => (role ? validateProfile(role, data) : {}), [role, data]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const touch = (key: keyof ProfileData) => setTouched((t) => ({ ...t, [key]: true }));

  const reject = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const revealErrors = () => {
    setTouched((t) => Object.keys(errors).reduce((acc, k) => ({ ...acc, [k]: true }), t));
    return Object.keys(errors).length === 0;
  };

  const pickRole = (r: OnboardingRole) => {
    setRole(r);
    setTouched({});
    setStep('profile');
    scrollTop();
  };

  const goToPreferences = () => {
    if (!revealErrors()) {
      reject();
      return;
    }
    setStep('preferences');
    scrollTop();
  };

  const backToProfile = () => {
    setTouched({});
    setStep('profile');
    scrollTop();
  };

  const handleSubmit = async () => {
    const invalid = Object.keys(errors) as (keyof ProfileData)[];

    if (!revealErrors()) {
      reject();
      // Profile fields only render on step 2, so take the user back to see them
      if (invalid.some((key) => PROFILE_STEP_FIELDS.includes(key))) {
        setStep('profile');
        scrollTop();
      }
      return;
    }
    if (!role) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, profile: toProfile(role, data) }),
      });

      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message =
          result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Unable to save your profile right now.';
        throw new Error(message);
      }

      setStep('done');
      scrollTop();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save your profile right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = PROGRESS[step];
  const label = stepLabel(step, role);
  const selectedOrg = orgs.find((o) => o.id === data.organizationId);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <IIJLogo size={40} showText={false} animated={false} />
          <span>
            <strong>IIJ</strong>
            <small>Institute for Independent Journalists</small>
          </span>
        </Link>
        <span className={styles.stepLabel}>{label}</span>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={styles.main}>
        {step === 'role' && <RoleStep onPick={pickRole} />}

        {step === 'profile' && role === 'editor' && (
          <EditorProfileStep
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            update={update}
            touch={touch}
            addOrg={(org) => {
              setOrgs((list) => [...list, org]);
              update('organizationId', org.id);
            }}
            onBack={() => setStep('role')}
            onNext={goToPreferences}
          />
        )}

        {step === 'profile' && role === 'freelancer' && (
          <FreelancerProfileStep
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            update={update}
            touch={touch}
            onBack={() => setStep('role')}
            onNext={goToPreferences}
          />
        )}

        {step === 'preferences' && role === 'editor' && (
          <EditorPreferencesStep
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            submitting={submitting}
            update={update}
            touch={touch}
            onBack={backToProfile}
            onSubmit={handleSubmit}
            submitError={submitError}
          />
        )}

        {step === 'preferences' && role === 'freelancer' && (
          <FreelancerPreferencesStep
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            submitting={submitting}
            update={update}
            touch={touch}
            onBack={backToProfile}
            onSubmit={handleSubmit}
            submitError={submitError}
          />
        )}

        {step === 'done' && role && (
          <DoneStep role={role} data={data} org={selectedOrg} onEdit={() => setStep('preferences')} />
        )}
      </main>
    </div>
  );
}
