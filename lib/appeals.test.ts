/**
 * @jest-environment node
 */
import { db } from './db';
import { listOpenAppeals, resolveAppeals, submitAppeal } from './appeals';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

describe('submitAppeal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('records the appeal against the suspended account with that email', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }).mockResolvedValueOnce({ rowCount: 1, rows: [] });

    await submitAppeal({ email: 'Amara@Example.com', message: 'Please look again' });

    const [findSql, findParams] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(findSql).toContain('suspended_at IS NOT NULL');
    expect(findParams).toEqual(['Amara@Example.com']);

    const [insertSql, insertParams] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(insertSql).toContain('INSERT INTO account_appeals');
    expect(insertParams).toEqual(['user-1', 'Amara@Example.com', 'Please look again']);
  });

  it('stores nothing when no suspended account holds that email', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await submitAppeal({ email: 'nobody@example.com', message: 'Hello' });

    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('does not pile up a second appeal while one is still open', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }).mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await submitAppeal({ email: 'amara@example.com', message: 'Again' });

    const [insertSql] = queryMock.mock.calls[1] as [string];
    expect(insertSql).toContain('WHERE NOT EXISTS');
    expect(insertSql).toContain("status IN ('open', 'reviewing')");
  });
});

describe('listOpenAppeals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps the rows onto the appeal the admin area shows', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'appeal-1',
          user_id: 'user-1',
          email: 'amara@example.com',
          message: 'My portfolio was misread.',
          status: 'open',
          created_at: '2026-11-10T09:00:00.000Z',
          first_name: 'Amara',
          last_name: 'Okafor',
          suspension_reason: 'Copied portfolio',
        },
      ],
    });

    const [appeal] = await listOpenAppeals();

    expect(appeal).toEqual({
      id: 'appeal-1',
      userId: 'user-1',
      name: 'Amara Okafor',
      email: 'amara@example.com',
      message: 'My portfolio was misread.',
      suspensionReason: 'Copied portfolio',
      status: 'open',
      createdAt: '2026-11-10T09:00:00.000Z',
    });

    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toContain("a.status IN ('open', 'reviewing')");
  });

  it('falls back to the email when the account has no name', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          id: 'appeal-2',
          user_id: null,
          email: 'gone@example.com',
          message: 'Still here?',
          status: 'open',
          created_at: new Date('2026-11-10T09:00:00.000Z'),
          first_name: null,
          last_name: null,
          suspension_reason: null,
        },
      ],
    });

    const [appeal] = await listOpenAppeals();

    expect(appeal.name).toBe('gone@example.com');
    expect(appeal.userId).toBe('');
    expect(appeal.suspensionReason).toBeUndefined();
  });
});

describe('resolveAppeals', () => {
  beforeEach(() => jest.clearAllMocks());

  it('settles every open appeal for the account', async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [] });

    await resolveAppeals('user-1');

    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("SET status = 'resolved'");
    expect(params).toEqual(['user-1']);
  });
});
