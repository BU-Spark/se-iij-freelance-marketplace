'use client';

import { useState } from 'react';
import { useToast } from '../../components';
import type { RosterInvite } from '../../../lib/roster';
import styles from './freelancer.module.css';

type RosterInvitesProps = { invites: RosterInvite[] };

const invitedOn = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/**
 * Editors who saved this freelancer to their roster. The favorite is already in place, so answering
 * is optional: it just tells the editor whether they are interested.
 */
export default function RosterInvites({ invites }: RosterInvitesProps) {
  const [items, setItems] = useState(invites);
  const [busy, setBusy] = useState<string | null>(null);
  const { showToast } = useToast();

  const respond = async (invite: RosterInvite, response: 'accepted' | 'declined') => {
    setBusy(invite.editorId);

    try {
      const res = await fetch(`/api/roster/invites/${invite.editorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        showToast(body?.error ?? 'Could not answer the invitation right now.', 'error');
        return;
      }

      setItems((list) =>
        list.map((item) => (item.editorId === invite.editorId ? { ...item, status: response } : item))
      );
      showToast(
        response === 'accepted'
          ? `Let ${invite.editorName} know you're interested`
          : `Told ${invite.editorName} you're not available right now`,
        response === 'accepted' ? 'success' : 'info'
      );
    } catch (error) {
      console.error('Could not answer the roster invitation.', error);
      showToast('Could not answer the invitation right now.', 'error');
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) return null;

  const waiting = items.filter((invite) => invite.status === 'pending').length;

  return (
    <section className={styles.invites} aria-labelledby="invites-heading">
      <h2 id="invites-heading" className={styles.invitesTitle}>
        Saved by editors
        {waiting > 0 && (
          <span className={styles.invitesCount} aria-label={`${waiting} waiting on your answer`}>
            {waiting}
          </span>
        )}
      </h2>
      <p className={styles.invitesIntro}>
        Editors who saved you to their roster. You&apos;re on it either way — accept to let them know you&apos;re
        interested.
      </p>

      <ul className={styles.inviteList}>
        {items.map((invite) => (
          <li key={invite.editorId} className={styles.inviteRow}>
            <div className={styles.inviteWho}>
              <strong>{invite.editorName}</strong>
              <span>
                {invite.organizationId ? `${invite.organizationId} · ` : ''}Saved {invitedOn(invite.invitedAt)}
              </span>
            </div>

            {invite.status === 'pending' ? (
              <div className={styles.inviteActions} role="group" aria-label={`Invitation from ${invite.editorName}`}>
                <button
                  type="button"
                  className={styles.inviteAccept}
                  disabled={busy === invite.editorId}
                  onClick={() => void respond(invite, 'accepted')}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className={styles.inviteDecline}
                  disabled={busy === invite.editorId}
                  onClick={() => void respond(invite, 'declined')}
                >
                  Decline
                </button>
              </div>
            ) : (
              <span className={styles.inviteAnswered}>{invite.status === 'accepted' ? 'Accepted' : 'Declined'}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
