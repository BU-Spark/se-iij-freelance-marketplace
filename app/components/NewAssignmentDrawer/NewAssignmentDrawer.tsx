'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './NewAssignmentDrawer.module.css';
import type { NewAssignment } from '../../types/assignments.types';
import type { RosterMember } from '../../types/dashboard.types';
import {
  createSlug, // ← changed
  EMPTY_ASSIGNMENT,
  hasErrors,
  validateAssignment,
  type AssignmentErrors,
} from '../../utils/assignment.utils';
import NewAssignmentForm from '../NewAssignmentForm/NewAssignmentForm';
import InviteList from '../InviteList/InviteList';

type NewAssignmentDrawerProps = {
  /** Where to go when the drawer closes, e.g. "/dashboard" */
  closeHref: string;
  /** Freelancers who can be invited */
  roster: RosterMember[];
};

type CreateAssignmentResponse = { error?: string; errors?: AssignmentErrors; code?: string };

export default function NewAssignmentDrawer({ closeHref, roster }: NewAssignmentDrawerProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  // everything typed into the form, kept here so the submit button can post it
  const [draft, setDraft] = useState<NewAssignment>(EMPTY_ASSIGNMENT);
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [formError, setFormError] = useState('');
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ids of the freelancers who are ticked
  const [invited, setInvited] = useState<string[]>([]);
  const toggleInvite = (id: string) =>
    setInvited((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const n = invited.length;
  const footNote = n === 0 ? 'Will post as open call' : `Will invite ${n} freelancer${n === 1 ? '' : 's'}`;

  const updateDraft = (patch: Partial<NewAssignment>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setFormError('');

    // drop the error for any field the editor just touched
    setErrors((current) => {
      const touched = Object.keys(patch) as Array<keyof NewAssignment>;
      if (!touched.some((field) => current[field])) return current;
      const next = { ...current };
      touched.forEach((field) => delete next[field]);
      return next;
    });
  };

  const submitAssignment = async () => {
    // ← changed: slug = title + random code, made fresh on every submit
    const toSave: NewAssignment = { ...draft, slug: createSlug(draft.title) };

    const nextErrors = validateAssignment(toSave); // ← changed
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    setFormError('');
    setOnboardingRequired(false);

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...toSave, // ← changed
          // datetime-local values have no timezone; send an absolute instant
          deadline: toSave.deadline ? new Date(toSave.deadline).toISOString() : '',
        }),
      });
      const payload = (await response.json().catch(() => null)) as CreateAssignmentResponse | null;

      if (!response.ok) {
        setFormError(payload?.error ?? 'Unable to create the assignment. Please try again.');
        setOnboardingRequired(payload?.code === 'onboarding_required');
        if (payload?.errors) setErrors(payload.errors);
        return;
      }

      router.push(closeHref, { scroll: false });
      router.refresh();
    } catch {
      setFormError('Unable to create the assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // move keyboard focus into the drawer when it opens
    panelRef.current?.focus();

    // Escape closes the drawer
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(closeHref, { scroll: false });
    };
    document.addEventListener('keydown', onKey);

    // stop the page behind from scrolling while the drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [router, closeHref]);

  return (
    <>
      {/* dimmed background; clicking it closes the drawer */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close new assignment"
        tabIndex={-1}
        onClick={() => router.push(closeHref, { scroll: false })}
      />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-assignment-title"
        tabIndex={-1}
      >
        <div className={styles.head}>
          <div>
            <h2 id="new-assignment-title" className={styles.title}>
              New Assignment
            </h2>
            <p className={styles.subtitle}>Describe the work, then pick freelancers to invite.</p>
          </div>
          <Link href={closeHref} scroll={false} className={styles.close} aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        </div>

        <div className={styles.body}>
          {formError && (
            <p role="alert" className={styles.formError}>
              {formError}{' '}
              {onboardingRequired && (
                <Link href="/onboarding" className={styles.formErrorLink}>
                  Finish onboarding →
                </Link>
              )}
            </p>
          )}
          <NewAssignmentForm draft={draft} onChange={updateDraft} errors={errors} />
          <InviteList members={roster} selected={invited} onToggle={toggleInvite} />
        </div>

        <div className={styles.foot}>
          <p className={styles.footNote}>{footNote}</p>
          {/* TODO: persist the invite selection once the invites table exists */}
          <button type="button" className={styles.send} onClick={submitAssignment} disabled={submitting}>
            {submitting ? 'Posting…' : n === 0 ? 'Post assignment' : 'Send invites'}
          </button>
        </div>
      </div>
    </>
  );
}
