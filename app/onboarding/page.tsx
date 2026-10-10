'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import IIJLogo from '../components/IIJLogo';
import styles from './onboarding.module.css';
import { DEFAULT_ORGS, EMPTY } from './constants';
import type { Organization, ProfileData, Role, Step } from '../types/onboarding.types';
import { validateProfile } from '../utils/validation.utils';
import RoleStep from './steps/RoleStep';
import ProfileStep, { type Touched } from './steps/ProfileStep';
import DoneStep from './steps/DoneStep';

const STEP_META: Record<Step, { progress: number; label: string }> = {
  role: { progress: 33, label: 'Step 1 of 2 — Who are you?' },
  profile: { progress: 66, label: 'Step 2 of 2 — Your profile' },
  done: { progress: 100, label: 'All done' },
};

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [orgs, setOrgs] = useState<Organization[]>(DEFAULT_ORGS);
  const [touched, setTouched] = useState<Touched>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => (role ? validateProfile(role, data) : {}), [role, data]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const touch = (key: keyof ProfileData) => setTouched((t) => ({ ...t, [key]: true }));

  const pickRole = (r: Role) => {
    setRole(r);
    setTouched({});
    setStep('profile');
    scrollTop();
  };

  const handleSubmit = async () => {
    const all = Object.keys(errors).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched((t) => ({ ...t, ...all }));

    if (Object.keys(errors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    // TODO: replace with your real API call, e.g. await fetch("/api/profile", {...})
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setStep('done');
    scrollTop();
  };

  const { progress, label } = STEP_META[step];
  const selectedOrg = orgs.find((o) => o.id === data.orgId);

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

        {step === 'profile' && role && (
          <ProfileStep
            role={role}
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            submitting={submitting}
            update={update}
            touch={touch}
            addOrg={(o) => {
              setOrgs((list) => [...list, o]);
              update('orgId', o.id);
            }}
            onBack={() => setStep('role')}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'done' && role && (
          <DoneStep role={role} data={data} org={selectedOrg} onEdit={() => setStep('profile')} />
        )}
      </main>
    </div>
  );
}
