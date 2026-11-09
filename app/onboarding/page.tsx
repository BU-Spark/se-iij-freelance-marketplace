'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { IIJLogo } from '../components';
import styles from './onboarding.module.css';
import { DEFAULT_ORGS, EMPTY } from './constants';
import type { OnboardingRole, OrgOption, ProfileData, ProfileErrors, Step, Touched } from '../types/onboarding.types';
import { validateProfile, validateStep } from '../utils/validation.utils';
import RoleStep from './steps/RoleStep';
import AgeStep from './steps/AgeStep';
import DoneStep from './steps/DoneStep';
import EditorProfileStep from './steps/editor/EditorProfileStep';
import EditorPreferencesStep from './steps/editor/EditorPreferencesStep';
import FreelancerProfileStep from './steps/freelancer/FreelancerProfileStep';
import FreelancerPreferencesStep from './steps/freelancer/FreelancerPreferencesStep';
import { detectTimezone, toProfile } from '../utils/profile.utils';

/** Canonical order, so the flow always runs editor steps before freelancer steps */
const ALL_ROLES: OnboardingRole[] = ['editor', 'freelancer'];

const STEP_TITLES: Record<OnboardingRole, Record<'profile' | 'preferences', string>> = {
  editor: { profile: 'Your newsroom', preferences: 'How you work' },
  freelancer: { profile: 'Your reporting', preferences: 'Rates & availability' },
};

/**
 * role -> age gate -> a profile and preferences step per selected role -> done.
 * Adding a role to an existing profile skips the gate: that person already went through it.
 */
const buildSequence = (roles: OnboardingRole[], withAge = true): Step[] => [
  'role',
  ...(withAge ? (['age'] as Step[]) : []),
  ...roles.flatMap((role): Step[] => [`${role}-profile`, `${role}-preferences`]),
  'done',
];

const stepRole = (step: Step): OnboardingRole | null => {
  if (step.startsWith('editor')) return 'editor';
  if (step.startsWith('freelancer')) return 'freelancer';
  return null;
};

const stepTitle = (step: Step): string => {
  if (step === 'role') return 'Who are you?';
  if (step === 'age') return 'Your age';
  if (step === 'done') return 'All done';

  const role = stepRole(step) as OnboardingRole;
  const phase = step.endsWith('-profile') ? 'profile' : 'preferences';
  return STEP_TITLES[role][phase];
};

const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export default function OnboardingPage() {
  const [roles, setRoles] = useState<OnboardingRole[]>([]);
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [orgs, setOrgs] = useState<OrgOption[]>(DEFAULT_ORGS);
  const [touched, setTouched] = useState<Touched>({});
  const [roleError, setRoleError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // a flow seeded from an existing profile is adding a role, so it is already past the age gate
  const [seeded, setSeeded] = useState(false);

  // Seeded in an effect so the server and first client render agree on the value
  useEffect(() => {
    setData((d) => (d.timezone ? d : { ...d, timezone: detectTimezone() }));
  }, []);

  // Arriving from "Add the freelancer role": reopen the saved profile and land on that role,
  // so nobody has to retype (or overwrite) what they already filled in.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('add');
    if (requested !== 'editor' && requested !== 'freelancer') return;

    let cancelled = false;

    const seed = async () => {
      try {
        const response = await fetch('/api/profile/onboarding');
        if (!response.ok) return;

        const { roles: saved, data: answers } = (await response.json()) as {
          roles: OnboardingRole[];
          data: Partial<ProfileData>;
        };
        if (cancelled) return;

        const nextRoles = ALL_ROLES.filter((role) => saved.includes(role) || role === requested);
        setSeeded(true);
        setRoles(nextRoles);
        setData((d) => ({ ...d, ...answers, timezone: answers.timezone || d.timezone }));
        setIndex(Math.max(0, buildSequence(nextRoles, false).indexOf(`${requested}-profile`)));
      } catch {
        // if the seed cannot be read, the normal flow still works — just from empty
      }
    };

    void seed();

    return () => {
      cancelled = true;
    };
  }, []);

  const sequence = useMemo(() => buildSequence(roles, !seeded), [roles, seeded]);
  const step = sequence[Math.min(index, sequence.length - 1)];
  /** The shared account fields belong to the first profile step, whatever sits before it */
  const firstProfileIndex = sequence.findIndex((candidate) => candidate.endsWith('-profile'));
  const errors = useMemo(() => validateStep(step, roles, data), [step, roles, data]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const touch = (key: keyof ProfileData) => setTouched((t) => ({ ...t, [key]: true }));

  const reject = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const markTouched = (keys: string[]) => setTouched((t) => keys.reduce((acc, key) => ({ ...acc, [key]: true }), t));

  /** Roles are only rebuildable from the picker, so keep them in canonical order */
  const toggleRole = (role: OnboardingRole) => {
    setRoleError(null);
    setRoles((list) =>
      ALL_ROLES.filter((candidate) => (candidate === role ? !list.includes(role) : list.includes(candidate)))
    );
  };

  const goNext = () => {
    if (step === 'role') {
      const problem = validateStep('role', roles, data).roles;
      if (problem) {
        setRoleError(problem);
        reject();
        return;
      }
      setRoleError(null);
    } else if (Object.keys(errors).length > 0) {
      markTouched(Object.keys(errors));
      reject();
      return;
    }

    setTouched({});
    setIndex((i) => Math.min(i + 1, sequence.length - 1));
    scrollTop();
  };

  /** "Change role" on a profile step skips the age gate it already passed */
  const backToRoles = () => {
    setTouched({});
    setRoleError(null);
    setIndex(0);
    scrollTop();
  };

  const goBack = () => {
    setTouched({});
    setRoleError(null);
    setIndex((i) => Math.max(i - 1, 0));
    scrollTop();
  };

  /** Submit validates everything, so surface the step that is actually blocking */
  const focusFirstProblem = (problems: ProfileErrors) => {
    if (problems.roles) {
      setRoleError(problems.roles);
      if (index !== 0) {
        setIndex(0);
        scrollTop();
      }
      return;
    }

    const blocking = sequence.findIndex(
      (candidate, position) =>
        position > 0 && candidate !== 'done' && Object.keys(validateStep(candidate, roles, data)).length > 0
    );
    if (blocking < 0) return;

    markTouched(Object.keys(validateStep(sequence[blocking], roles, data)));
    if (blocking !== index) {
      setIndex(blocking);
      scrollTop();
    }
  };

  const handleSubmit = async () => {
    const problems = validateProfile(roles, data, !seeded);

    if (Object.keys(problems).length > 0) {
      reject();
      focusFirstProblem(problems);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toProfile(roles, data)),
      });

      if (!response.ok) {
        const result: unknown = await response.json().catch(() => null);
        const message =
          result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
            ? result.error
            : 'Unable to save your profile right now.';
        throw new Error(message);
      }

      setIndex(sequence.length - 1);
      scrollTop();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save your profile right now.');
    } finally {
      setSubmitting(false);
    }
  };

  // `done` is not a step the user fills in, so it sits outside the counter
  const total = sequence.length - 1;
  const progress = total > 0 ? Math.round((index / total) * 100) : 0;
  const label =
    step === 'done' ? 'All done' : total > 1 ? `Step ${index + 1} of ${total} — ${stepTitle(step)}` : 'Who are you?';
  const selectedOrg = orgs.find((o) => o.id === data.organizationId);

  // With two roles the first preferences step must continue, not create the profile
  const isFinalStep = index === sequence.length - 2;
  const preferencesActions = {
    submitting: isFinalStep && submitting,
    onSubmit: isFinalStep ? handleSubmit : goNext,
    submitError: isFinalStep ? submitError : null,
    submitLabel: isFinalStep ? 'Create profile →' : 'Continue →',
  };

  const stepProps = {
    data,
    orgs,
    errors,
    touched,
    shake,
    update,
    touch,
    onBack: goBack,
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <IIJLogo size={40} showText={false} animated={false} />
          <span>
            <strong>IIJ</strong>
            <small>StoryMatch</small>
          </span>
        </Link>
        <span className={styles.stepLabel}>{label}</span>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={styles.main}>
        {step === 'role' && (
          <RoleStep selected={roles} onToggle={toggleRole} onNext={goNext} error={roleError ?? undefined} />
        )}

        {step === 'age' && (
          <AgeStep
            data={data}
            errors={errors}
            touched={touched}
            shake={shake}
            update={update}
            touch={touch}
            onBack={goBack}
            onNext={goNext}
          />
        )}

        {step === 'editor-profile' && (
          <EditorProfileStep
            {...stepProps}
            onBackToRoles={backToRoles}
            showBasics={index === firstProfileIndex}
            addOrg={(org) => {
              setOrgs((list) => [...list, org]);
              update('organizationId', org.id);
            }}
            onNext={goNext}
          />
        )}

        {step === 'editor-preferences' && <EditorPreferencesStep {...stepProps} {...preferencesActions} />}

        {step === 'freelancer-profile' && (
          <FreelancerProfileStep
            {...stepProps}
            onBackToRoles={backToRoles}
            showBasics={index === firstProfileIndex}
            onNext={goNext}
          />
        )}

        {step === 'freelancer-preferences' && <FreelancerPreferencesStep {...stepProps} {...preferencesActions} />}

        {step === 'done' && (
          <DoneStep
            roles={roles}
            data={data}
            org={selectedOrg}
            onEdit={() => {
              setIndex(Math.max(0, firstProfileIndex));
              scrollTop();
            }}
          />
        )}
      </main>
    </div>
  );
}
