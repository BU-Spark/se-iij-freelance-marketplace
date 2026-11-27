import type { RosterMember } from '../types/dashboard.types';

/** Where a favorite stands: saved privately, or pre-invited and then answered */
export type PreInviteState = 'none' | 'invited' | 'accepted' | 'declined';

/** Someone not pre-invited has no label: the Pre-invite button already says so */
export const PRE_INVITE_LABEL: Record<Exclude<PreInviteState, 'none'>, string> = {
  invited: 'Pre-invited',
  accepted: 'Accepted',
  declined: 'Declined',
};

/** A silent save also stores a status, so only a notified favorite counts as pre-invited */
export function preInviteState(member: RosterMember): PreInviteState {
  if (!member.notified) return 'none';
  if (member.inviteStatus === 'accepted' || member.inviteStatus === 'declined') return member.inviteStatus;
  return 'invited';
}

/** The API sends a first pre-invitation, and re-opens a declined one */
export function canPreInvite(member: RosterMember): boolean {
  const state = preInviteState(member);
  return state === 'none' || state === 'declined';
}
