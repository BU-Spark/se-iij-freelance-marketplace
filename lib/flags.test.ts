/**
 * @jest-environment node
 */
import { db } from './db';
import { listFlags, loadFlagTarget, setFlagStatus, submitFlag } from './flags';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const ASSIGNMENT_ID = '11111111-1111-4111-8111-111111111111';
const PITCH_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';

const reporter = { id: USER_ID, name: 'Ada Editor', email: 'ada@example.com' };

beforeEach(() => jest.clearAllMocks());

describe('loadFlagTarget', () => {
  it('labels an account by name, falling back to the email', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: USER_ID, name: 'Jordan Lee', email: 'jordan@example.com' }] });
    expect(await loadFlagTarget('account', USER_ID)).toEqual({ label: 'Jordan Lee', ownerUserId: USER_ID });

    queryMock.mockResolvedValueOnce({ rows: [{ id: USER_ID, name: '', email: 'jordan@example.com' }] });
    expect(await loadFlagTarget('account', USER_ID)).toEqual({ label: 'jordan@example.com', ownerUserId: USER_ID });
  });

  it('labels an assignment by its title and remembers who posted it', async () => {
    queryMock.mockResolvedValue({ rows: [{ title: 'Transit strike explainer', created_by_user_id: 'owner-1' }] });

    expect(await loadFlagTarget('assignment', ASSIGNMENT_ID)).toEqual({
      label: 'Transit strike explainer',
      ownerUserId: 'owner-1',
    });

    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain('FROM assignments');
  });

  it('labels a pitch from its slug', async () => {
    queryMock.mockResolvedValue({ rows: [{ slug: 'shadow-budget-city-hall', freelancer_user_id: 'owner-1' }] });

    expect(await loadFlagTarget('pitch', PITCH_ID)).toEqual({
      label: 'Shadow budget city hall',
      ownerUserId: 'owner-1',
    });
  });

  it('does not touch the database for an id that cannot be a UUID', async () => {
    expect(await loadFlagTarget('account', 'not-an-id')).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('submitFlag', () => {
  const record = (overrides: Partial<Parameters<typeof submitFlag>[0]> = {}) =>
    submitFlag({
      reporterClerkId: 'clerk-1',
      targetType: 'assignment',
      targetId: ASSIGNMENT_ID,
      reason: 'The pay is below the posted minimum.',
      ...overrides,
    });

  it('records the flag with the reporter and the target label read from the database', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [reporter] })
      .mockResolvedValueOnce({ rows: [{ title: 'Transit strike explainer', created_by_user_id: 'owner-1' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    expect(await record()).toEqual({ status: 'recorded', duplicate: false });

    const [insertSql, insertParams] = queryMock.mock.calls[2] as [string, unknown[]];
    expect(insertSql).toContain('INSERT INTO content_flags');
    expect(insertSql).toContain('WHERE NOT EXISTS');
    expect(insertSql).toContain("status IN ('open', 'reviewing')");
    expect(insertParams).toEqual([
      'assignment',
      ASSIGNMENT_ID,
      'Transit strike explainer',
      'The pay is below the posted minimum.',
      USER_ID,
      'Ada Editor',
    ]);
  });

  it('calls a second flag from the same person a duplicate while one is waiting', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [reporter] })
      .mockResolvedValueOnce({ rows: [{ title: 'Transit strike explainer', created_by_user_id: 'owner-1' }] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    expect(await record()).toEqual({ status: 'recorded', duplicate: true });
  });

  it('stops before the target lookup when the reporter has not onboarded', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    expect(await record()).toEqual({ status: 'not-onboarded' });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('reports a target that no longer exists', async () => {
    queryMock.mockResolvedValueOnce({ rows: [reporter] }).mockResolvedValueOnce({ rows: [] });

    expect(await record()).toEqual({ status: 'not-found' });
  });

  it('refuses to let someone flag their own content', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [reporter] })
      .mockResolvedValueOnce({ rows: [{ title: 'My own post', created_by_user_id: USER_ID }] });

    expect(await record()).toEqual({ status: 'own' });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('uses the email when the reporter has no name', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: USER_ID, name: '', email: 'ada@example.com' }] })
      .mockResolvedValueOnce({ rows: [{ slug: 'shadow-budget', freelancer_user_id: 'owner-1' }] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] });

    await record({ targetType: 'pitch', targetId: PITCH_ID });

    const [, insertParams] = queryMock.mock.calls[2] as [string, unknown[]];
    expect(insertParams[5]).toBe('ada@example.com');
  });
});

describe('listFlags', () => {
  it('maps the rows onto the reports the admin inbox renders', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'flag-1',
          target_type: 'pitch',
          target_id: PITCH_ID,
          target_label: 'Shadow budget city hall',
          reason: 'Looks copied.',
          reporter_name: 'Ada Editor',
          status: 'open',
          created_at: '2026-11-10T09:00:00.000Z',
        },
      ],
    });

    expect(await listFlags()).toEqual([
      {
        id: 'flag-1',
        targetType: 'pitch',
        targetId: PITCH_ID,
        targetLabel: 'Shadow budget city hall',
        reason: 'Looks copied.',
        reporterName: 'Ada Editor',
        status: 'open',
        createdAt: '2026-11-10T09:00:00.000Z',
      },
    ]);
  });
});

describe('setFlagStatus', () => {
  it('updates the flag and returns its new state', async () => {
    const FLAG_ID = '44444444-4444-4444-8444-444444444444';
    queryMock.mockResolvedValue({
      rows: [
        {
          id: FLAG_ID,
          target_type: 'account',
          target_id: USER_ID,
          target_label: 'Jordan Lee',
          reason: 'Impersonation.',
          reporter_name: 'Ada Editor',
          status: 'resolved',
          created_at: new Date('2026-11-10T09:00:00.000Z'),
        },
      ],
    });

    const flag = await setFlagStatus(FLAG_ID, 'resolved');

    expect(flag).toMatchObject({ id: FLAG_ID, status: 'resolved', createdAt: '2026-11-10T09:00:00.000Z' });

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE content_flags');
    expect(params).toEqual([FLAG_ID, 'resolved']);
  });

  it('answers null for an id that is not a flag UUID', async () => {
    expect(await setFlagStatus('nope', 'resolved')).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });
});
