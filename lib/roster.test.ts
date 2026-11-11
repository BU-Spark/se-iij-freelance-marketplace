/**
 * @jest-environment node
 */
import { db } from './db';
import {
  inviteFreelancers,
  listInvitedIds,
  listInvitesForFreelancer,
  listRoster,
  loadEditorRoster,
  removeFromRoster,
  respondToInvite,
} from './roster';
import type { RosterRow } from '../app/utils/roster.utils';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const row: RosterRow = {
  id: 'user-1',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  location: 'Leeds, UK',
  reporting_beats: ['Politics'],
  beat_tags: [],
  work_mediums: ['Text'],
  availability: {
    timezone: 'UTC',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
  },
};

describe('listRoster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('only selects people who still hold the freelancer role, and copes with none', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(listRoster()).resolves.toEqual([]);

    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain('JOIN freelancers');
    expect(sql).toContain("'freelancer' = ANY(u.roles)");
    // editors see someone as available when they have marked themselves free right now
    expect(sql).toContain('u.available_now');

    queryMock.mockRejectedValue(new Error('db down'));
    await expect(listRoster()).rejects.toThrow('db down');
  });

  it('maps the rows onto roster cards', async () => {
    queryMock.mockResolvedValue({ rows: [row] });

    const [member] = await listRoster(new Date('2026-11-04T12:00:00.000Z'));

    expect(member).toMatchObject({
      id: 'user-1',
      name: 'Sarah Jenkins',
      specialty: 'Politics',
      city: 'Leeds, UK',
      status: 'available',
    });
  });
});

describe('loadEditorRoster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('splits the directory into accepted members, pending invites and everyone else', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] }).mockResolvedValueOnce({
      rows: [
        { ...row, invited_at: null, status: null },
        { ...row, id: 'user-2', first_name: 'Amara', invited_at: '2026-11-01T10:00:00.000Z', status: 'accepted' },
        { ...row, id: 'user-3', first_name: 'Jonah', invited_at: '2026-11-09T10:00:00.000Z', status: 'pending' },
        { ...row, id: 'user-4', first_name: 'Rosa', invited_at: '2026-11-02T10:00:00.000Z', status: 'declined' },
      ],
    });

    const { members, pending, invitable } = await loadEditorRoster('clerk-1', new Date('2026-11-04T12:00:00.000Z'));

    expect(invitable.map((m) => m.id)).toEqual(['user-1']);
    expect(invitable[0].invitedAt).toBeUndefined();
    expect(members.map((m) => m.id)).toEqual(['user-2']);
    expect(members[0].inviteStatus).toBe('accepted');
    expect(pending.map((m) => [m.id, m.inviteStatus])).toEqual([
      ['user-3', 'pending'],
      ['user-4', 'declined'],
    ]);

    const [joinSql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(joinSql).toContain('LEFT JOIN roster_invites');
    expect(joinSql).toContain('u.available_now');
    expect(params).toEqual(['editor-1']);
  });

  it('gives an empty roster when onboarding has not written the editor row', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(loadEditorRoster('clerk-missing')).resolves.toEqual({ members: [], pending: [], invitable: [] });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});

describe('inviteFreelancers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks real freelancers and reports the invite as pending', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] }).mockResolvedValueOnce({
      rows: [{ freelancer_user_id: 'user-2', invited_at: '2026-11-11T09:00:00.000Z', status: 'pending' }],
    });

    await expect(inviteFreelancers('clerk-1', ['user-2'])).resolves.toEqual({
      invited: [{ freelancerId: 'user-2', invitedAt: '2026-11-11T09:00:00.000Z', status: 'pending' }],
    });

    const [sql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(sql).toContain("'freelancer' = ANY(u.roles)");
    // a declined invite reopens rather than being ignored
    expect(sql).toContain("WHERE roster_invites.status = 'declined'");
    expect(params).toEqual(['editor-1', ['user-2']]);
  });

  it('returns null when the signed-in person has no row yet', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(inviteFreelancers('clerk-missing', ['user-2'])).resolves.toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});

describe('removeFromRoster', () => {
  beforeEach(() => jest.clearAllMocks());

  it('tells "removed" apart from "was not on the roster"', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] }).mockResolvedValueOnce({ rowCount: 1 });
    await expect(removeFromRoster('clerk-1', 'user-2')).resolves.toBe(true);

    queryMock.mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] }).mockResolvedValueOnce({ rowCount: 0 });
    await expect(removeFromRoster('clerk-1', 'user-2')).resolves.toBe(false);
  });

  it('returns null when the signed-in person has no row yet', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(removeFromRoster('clerk-missing', 'user-2')).resolves.toBeNull();
  });
});

describe('listInvitedIds', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists the freelancers this editor invited', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] })
      .mockResolvedValueOnce({ rows: [{ freelancer_user_id: 'user-2' }, { freelancer_user_id: 'user-3' }] });

    await expect(listInvitedIds('clerk-1')).resolves.toEqual(['user-2', 'user-3']);
  });

  it('gives nothing when the person has no row yet', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(listInvitedIds('clerk-missing')).resolves.toEqual([]);
  });
});

describe('listInvitesForFreelancer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('names the editor and puts unanswered invitations first', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'freelancer-1' }] }).mockResolvedValueOnce({
      rows: [
        {
          editor_user_id: 'editor-1',
          invited_at: '2026-11-09T10:00:00.000Z',
          status: 'pending',
          first_name: 'Jane',
          last_name: 'Doe',
          organization_id: 'org-1',
        },
        {
          editor_user_id: 'editor-2',
          invited_at: '2026-11-01T10:00:00.000Z',
          status: 'accepted',
          first_name: null,
          last_name: null,
          organization_id: null,
        },
      ],
    });

    const invites = await listInvitesForFreelancer('clerk-1');

    expect(invites[0]).toEqual({
      editorId: 'editor-1',
      editorName: 'Jane Doe',
      organizationId: 'org-1',
      invitedAt: '2026-11-09T10:00:00.000Z',
      status: 'pending',
    });
    expect(invites[1]).toMatchObject({ editorName: 'An editor', status: 'accepted' });

    const [sql] = queryMock.mock.calls[1] as [string];
    expect(sql).toContain("CASE r.status WHEN 'pending' THEN 0 ELSE 1 END");
  });

  it('gives nothing when the person has no row yet', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(listInvitesForFreelancer('clerk-missing')).resolves.toEqual([]);
  });
});

describe('respondToInvite', () => {
  beforeEach(() => jest.clearAllMocks());

  it('answers the invite addressed to the signed-in freelancer', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'freelancer-1' }] }).mockResolvedValueOnce({ rowCount: 1 });

    await expect(respondToInvite('clerk-1', 'editor-1', 'accepted')).resolves.toBe(true);

    const [sql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(sql).toContain("AND status = 'pending'");
    expect(params).toEqual(['editor-1', 'freelancer-1', 'accepted']);
  });

  it('says so when there was nothing pending to answer', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'freelancer-1' }] }).mockResolvedValueOnce({ rowCount: 0 });

    await expect(respondToInvite('clerk-1', 'editor-1', 'declined')).resolves.toBe(false);
  });

  it('returns null when the person has no row yet', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(respondToInvite('clerk-missing', 'editor-1', 'accepted')).resolves.toBeNull();
  });
});
