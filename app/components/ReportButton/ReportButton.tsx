'use client';

import { useState } from 'react';
import Modal from '../Modal/Modal';
import { useToast } from '../Toast/ToastProvider';
import type { FlagTarget } from '../../types/admin.types';
import styles from './ReportButton.module.css';

const MAX_REASON_LENGTH = 500;

const TARGET_NAME: Record<FlagTarget, string> = {
  account: 'account',
  assignment: 'assignment',
  pitch: 'pitch',
};

type ReportButtonProps = {
  targetType: FlagTarget;
  targetId: string;
  /** shown in the dialog and used in the accessible button name */
  targetLabel: string;
  /** icon-only in card headers; a small labelled button elsewhere */
  compact?: boolean;
};

/** A small flag that opens a reason form and sends the report to the Story Match team */
export default function ReportButton({ targetType, targetId, targetLabel, compact = false }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const close = () => {
    if (saving) return;
    setOpen(false);
    setError('');
    setReason('');
  };

  const send = async () => {
    const trimmed = reason.trim();

    if (!trimmed) {
      setError('Tell the team what is wrong.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason: trimmed }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string; duplicate?: boolean } | null;

      if (!response.ok) {
        setError(body?.error ?? 'Unable to send the report right now.');
        return;
      }

      setOpen(false);
      setReason('');
      showToast(
        body?.duplicate ? 'You already reported this — the team is on it.' : 'Report sent to the Story Match team.'
      );
    } catch (cause) {
      console.error('Could not send a report.', cause);
      setError('Unable to send the report right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={compact ? `${styles.trigger} ${styles.compact}` : styles.trigger}
        aria-label={`Report ${targetLabel}`}
        title={`Report this ${TARGET_NAME[targetType]}`}
        onClick={() => setOpen(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 3v18M5 4h11l-2 3 2 3H5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {!compact && <span>Report</span>}
      </button>

      {open && (
        <Modal
          title={`Report this ${TARGET_NAME[targetType]}`}
          subtitle={targetLabel}
          onClose={close}
          footer={
            <>
              <span className={styles.counter}>
                {reason.trim().length}/{MAX_REASON_LENGTH}
              </span>
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={close} disabled={saving}>
                  Cancel
                </button>
                <button type="button" className={styles.primary} onClick={() => void send()} disabled={saving}>
                  {saving ? 'Sending…' : 'Send report'}
                </button>
              </div>
            </>
          }
        >
          <div className={styles.body}>
            <label className={styles.label}>
              What&apos;s wrong?
              <textarea
                className={styles.textarea}
                value={reason}
                maxLength={MAX_REASON_LENGTH}
                placeholder="Describe the problem, for example impersonation, spam, or pay that does not match the listing."
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <p className={styles.note}>
              The Story Match team will see your name and this note. You can keep using the app while they look.
            </p>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
