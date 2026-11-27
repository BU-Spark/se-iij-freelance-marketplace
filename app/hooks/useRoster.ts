'use client';

import { useState } from 'react';
import { useToast } from '../components/Toast/ToastProvider';
import type { RosterMember } from '../types/dashboard.types';

type SavedRow = { freelancerId: string; invitedAt: string };
type ApiBody = { saved?: SavedRow[]; error?: string } | null;

/*
 * Roster changes, kept in one place for the pages that use them. The list only changes once the roster
 * API confirms, so a failed request shows an error instead of a change that never happened.
 */
export function useRoster(initial: RosterMember[]) {
  const { showToast } = useToast();
  const [people, setPeople] = useState(initial);
  /** the id of the person with a request in flight */
  const [busyId, setBusyId] = useState<string | null>(null);

  /** Also saves them to the roster if they were not on it yet */
  const preInvite = async (member: RosterMember) => {
    const failure = 'Could not send the pre-invitation right now.';
    setBusyId(member.id);

    try {
      const response = await fetch('/api/roster/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerIds: [member.id], notify: true }),
      });
      const body = (await response.json().catch(() => null)) as ApiBody;

      if (!response.ok) {
        showToast(body?.error ?? failure, 'error');
        return;
      }

      // the API only returns rows it changed, so a missing one was already pre-invited
      const row = body?.saved?.find((saved) => saved.freelancerId === member.id);
      if (!row) {
        showToast(`Nothing was sent. Refresh to see where ${member.name} stands.`, 'info');
        return;
      }

      setPeople((list) =>
        list.map((item) =>
          item.id === member.id ? { ...item, invitedAt: row.invitedAt, inviteStatus: 'pending', notified: true } : item
        )
      );
      showToast(`Pre-invitation sent to ${member.name}`);
    } catch (error) {
      console.error('Could not send a pre-invitation.', error);
      showToast(failure, 'error');
    } finally {
      setBusyId(null);
    }
  };

  /** True once the server has taken them off the roster */
  const remove = async (member: RosterMember) => {
    const failure = 'Could not remove them from your roster right now.';
    setBusyId(member.id);

    try {
      const response = await fetch(`/api/roster/invites/${member.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiBody;
        showToast(body?.error ?? failure, 'error');
        return false;
      }

      setPeople((list) => list.filter((item) => item.id !== member.id));
      showToast(`Removed ${member.name} from your roster`);
      return true;
    } catch (error) {
      console.error('Could not remove the freelancer from the roster.', error);
      showToast(failure, 'error');
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return { people, setPeople, busyId, preInvite, remove };
}
