/**
 * @jest-environment node
 */
import { db } from './db';
import { ensureBasicUser, hasProfile } from './profile';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  queryMock.mockResolvedValue({ rowCount: 0, rows: [] });
});

describe('hasProfile', () => {
  it('is true once the user row exists', async () => {
    queryMock.mockResolvedValue({ rowCount: 1, rows: [{ '?column?': 1 }] });
    await expect(hasProfile('clerk-1')).resolves.toBe(true);
  });

  it('is false while the user has not been written yet', async () => {
    await expect(hasProfile('clerk-1')).resolves.toBe(false);
  });
});

describe('ensureBasicUser', () => {
  it('writes the Clerk basics without touching an existing row', async () => {
    await ensureBasicUser('clerk-1', { email: 'admin@example.com', firstName: 'Joe', lastName: 'Lam' });

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, values] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO users');
    expect(sql).toContain('ON CONFLICT (clerk_id) DO NOTHING');
    expect(sql).not.toContain('roles');
    expect(values).toEqual(['clerk-1', 'admin@example.com', 'Joe', 'Lam']);
  });

  it('falls back to empty names because the columns are NOT NULL', async () => {
    await ensureBasicUser('clerk-1', { email: 'admin@example.com' });

    expect(queryMock).toHaveBeenCalledWith(expect.any(String), ['clerk-1', 'admin@example.com', '', '']);
  });
});
