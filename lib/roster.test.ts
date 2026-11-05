/**
 * @jest-environment node
 */
import { db } from './db';
import { listRoster } from './roster';
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
