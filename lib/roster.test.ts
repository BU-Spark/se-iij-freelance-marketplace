/**
 * @jest-environment node
 */
import { db } from './db';
import { inviteFreelancers, listInvitedIds, listRoster, loadEditorRoster, removeFromRoster } from './roster';
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

  it('splits the directory into the editor roster and everyone else', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] }).mockResolvedValueOnce({
      rows: [row, { ...row, id: 'user-2', first_name: 'Amara', invited_at: '2026-11-01T10:00:00.000Z' }],
    });

    const { members, invitable } = await loadEditorRoster('clerk-1', new Date('2026-11-04T12:00:00.000Z'));

    expect(invitable.map((m) => m.id)).toEqual(['user-1']);
    expect(invitable[0].invitedAt).toBeUndefined();
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ id: 'user-2', invitedAt: '2026-11-01T10:00:00.000Z' });

    const [joinSql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(joinSql).toContain('LEFT JOIN roster_invites');
    expect(params).toEqual(['editor-1']);
  });

  it('gives an empty roster when onboarding has not written the editor row', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(loadEditorRoster('clerk-missing')).resolves.toEqual({ members: [], invitable: [] });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});

describe('inviteFreelancers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('only inserts real freelancers and reports when they were added', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 'editor-1' }] })
      .mockResolvedValueOnce({ rows: [{ freelancer_user_id: 'user-2', invited_at: '2026-11-11T09:00:00.000Z' }] });

    await expect(inviteFreelancers('clerk-1', ['user-2'])).resolves.toEqual({
      invited: [{ freelancerId: 'user-2', invitedAt: '2026-11-11T09:00:00.000Z' }],
    });

    const [sql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(sql).toContain("'freelancer' = ANY(u.roles)");
    expect(sql).toContain('ON CONFLICT DO NOTHING');
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
