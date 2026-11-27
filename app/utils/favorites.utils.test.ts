import { canPreInvite, preInviteState } from './favorites.utils';
import type { RosterMember } from '../types/dashboard.types';

const member = (overrides: Partial<RosterMember> = {}) => ({ id: 'user-1', ...overrides }) as RosterMember;

describe('preInviteState', () => {
  it('treats a silent save as not pre-invited, whatever its stored status', () => {
    expect(preInviteState(member({ inviteStatus: 'accepted', notified: false }))).toBe('none');
    expect(preInviteState(member())).toBe('none');
  });

  it('follows the answer once the freelancer has been told', () => {
    expect(preInviteState(member({ inviteStatus: 'pending', notified: true }))).toBe('invited');
    expect(preInviteState(member({ inviteStatus: 'accepted', notified: true }))).toBe('accepted');
    expect(preInviteState(member({ inviteStatus: 'declined', notified: true }))).toBe('declined');
  });
});

describe('canPreInvite', () => {
  it('allows a first pre-invitation and another after a decline', () => {
    expect(canPreInvite(member())).toBe(true);
    expect(canPreInvite(member({ inviteStatus: 'declined', notified: true }))).toBe(true);
  });

  it('does not ask again while waiting or after a yes', () => {
    expect(canPreInvite(member({ inviteStatus: 'pending', notified: true }))).toBe(false);
    expect(canPreInvite(member({ inviteStatus: 'accepted', notified: true }))).toBe(false);
  });
});
