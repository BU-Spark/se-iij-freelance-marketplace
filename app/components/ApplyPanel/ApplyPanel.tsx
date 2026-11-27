'use client';

import { useState } from 'react';
import type { Assignment } from '../../types/assignments.types';
import { formatCompensation } from '../../utils/assignment.utils';
import ApplicationDialog, { formatDue } from './ApplicationDialog';
import { emptyDraft, type ApplicationDraft } from './application.utils';
import styles from './ApplyPanel.module.css';

type Sent = { values: ApplicationDraft; sentAt: Date };

// PREVIEW ONLY: there is no applications API yet, so all of this is forgotten on a page reload
const drafts = new Map<string, ApplicationDraft>();
const sentApplications = new Map<string, Sent>();
/** the links from the last application, so they don't have to be pasted again */
let lastSamples: string[] = [];

/** The freelancer's apply bar, pinned to the bottom of the assignment drawer */
export default function ApplyPanel({ assignment }: { assignment: Assignment }) {
  const { id, title } = assignment;
  const [sent, setSent] = useState(() => sentApplications.get(id));
  const [draft, setDraft] = useState(() => drafts.get(id));
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const change = (next: ApplicationDraft) => {
    drafts.set(id, next);
    setDraft(next);
  };

  const send = () => {
    const values = draft ?? sent?.values ?? emptyDraft(lastSamples);
    const saved = { values, sentAt: sent?.sentAt ?? new Date() };
    sentApplications.set(id, saved);
    drafts.delete(id);
    lastSamples = values.samples.filter((sample) => sample.trim());
    setSent(saved);
    setDraft(undefined);
    setOpen(false);
  };

  const withdraw = () => {
    // keep what they wrote as a draft, in case they apply again
    if (sent) change(sent.values);
    sentApplications.delete(id);
    setSent(undefined);
    setConfirming(false);
  };

  const pay = formatCompensation(assignment.compensation);
  const summary = [pay, assignment.deadline && `Due ${formatDue(assignment.deadline)}`].filter(Boolean).join(' · ');

  return (
    <section className={styles.bar} aria-label="Your application">
      <div className={styles.row}>
        <div className={styles.text} role="status">
          {confirming ? (
            <p className={styles.status}>Withdraw your application?</p>
          ) : sent ? (
            <>
              <p className={styles.applied}>✓ Applied {formatDue(sent.sentAt)}</p>
              {draft && <p className={styles.hint}>You have unsaved changes.</p>}
            </>
          ) : (
            <>
              <p className={styles.status}>{summary || 'Open to applications'}</p>
              {draft && <p className={styles.hint}>Draft saved</p>}
            </>
          )}
        </div>

        <div className={styles.actions}>
          {confirming ? (
            <>
              <button type="button" className={styles.secondary} onClick={() => setConfirming(false)}>
                Keep it
              </button>
              <button type="button" className={styles.danger} onClick={withdraw}>
                Yes, withdraw
              </button>
            </>
          ) : sent ? (
            <>
              <button type="button" className={styles.link} onClick={() => setConfirming(true)}>
                Withdraw
              </button>
              <button type="button" className={styles.secondary} onClick={() => setOpen(true)}>
                View or edit
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.primary}
              aria-label={`${draft ? 'Continue application' : 'Apply'}: ${title}`}
              onClick={() => setOpen(true)}
            >
              {draft ? 'Continue application' : 'Apply'}
            </button>
          )}
        </div>
      </div>
      <p className={styles.previewNote}>Preview only: applications are not saved or sent to editors yet.</p>

      {open && (
        <ApplicationDialog
          assignment={assignment}
          draft={draft ?? sent?.values ?? emptyDraft(lastSamples)}
          editing={Boolean(sent)}
          onChange={change}
          onSend={send}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
