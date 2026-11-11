/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../../lib/db';
import { GET, PATCH } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/db', () => ({ db: { query: jest.fn(), connect: jest.fn() } }));

const authMock = auth as unknown as jest.Mock;
const queryMock = db.query as jest.Mock;
const connectMock = db.connect as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const client = { query: jest.fn(), release: jest.fn() };

const patch = (body: unknown) =>
  PATCH(
    new Request('http://localhost/api/profile/availability', {
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

const validBody = {
  availableNow: true,
  timezone: 'Europe/London',
  days: ['monday', 'tuesday'],
  startsAt: '09:00',
  endsAt: '17:00',
};

const stored = {
  timezone: 'Europe/London',
  days: ['monday', 'tuesday'],
  typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
};

const row = (overrides: Record<string, unknown> = {}) => ({
  available_now: true,
  roles: ['freelancer'],
  freelancer_id: 'freelancer-1',
  freelancer_availability: stored,
  editor_id: null,
  editor_availability: null,
  ...overrides,
});

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  connectMock.mockResolvedValue(client);
  client.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'user-1' }] });
});

describe('GET /api/profile/availability', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await GET()).status).toBe(401);
  });

  it("returns the freelancer's saved hours", async () => {
    queryMock.mockResolvedValue({ rows: [row()] });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      role: 'freelancer',
      availableNow: true,
      timezone: 'Europe/London',
      days: ['monday', 'tuesday'],
      startsAt: '09:00',
      endsAt: '17:00',
      exceptions: [],
    });
  });

  it('returns the dates that do not follow the weekly pattern', async () => {
    queryMock.mockResolvedValue({
      rows: [
        row({
          freelancer_availability: {
            ...stored,
            exceptions: [
              { date: '2031-12-25', available: false },
              { date: '2031-11-21', available: true },
              { date: '2031-02-31', available: false },
            ],
          },
        }),
      ],
    });

    expect(await (await GET()).json()).toMatchObject({
      exceptions: [
        { date: '2031-11-21', available: true },
        { date: '2031-12-25', available: false },
      ],
    });
  });

  it("returns an editor's desk hours from the editor row", async () => {
    queryMock.mockResolvedValue({
      rows: [
        row({
          roles: ['editor'],
          freelancer_id: null,
          freelancer_availability: null,
          editor_id: 'editor-1',
          editor_availability: { ...stored, timezone: 'America/New_York' },
        }),
      ],
    });

    expect(await (await GET()).json()).toMatchObject({ role: 'editor', timezone: 'America/New_York' });
  });

  it('prefers the freelancer hours when the person holds both roles', async () => {
    queryMock.mockResolvedValue({
      rows: [row({ roles: ['editor', 'freelancer'], editor_id: 'editor-1', editor_availability: stored })],
    });

    expect(await (await GET()).json()).toMatchObject({ role: 'freelancer' });
  });

  it('gives nulls when nothing has been set yet', async () => {
    queryMock.mockResolvedValue({
      rows: [row({ available_now: null, freelancer_availability: null, roles: ['freelancer'] })],
    });

    expect(await (await GET()).json()).toEqual({
      role: 'freelancer',
      availableNow: false,
      timezone: null,
      days: [],
      startsAt: null,
      endsAt: null,
      exceptions: [],
    });
  });

  it('asks people to finish onboarding first', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
  });

  it('reports a failure instead of an empty card', async () => {
    queryMock.mockRejectedValue(new Error('db down'));

    expect((await GET()).status).toBe(500);
  });
});

describe('PATCH /api/profile/availability', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await patch(validBody)).status).toBe(401);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('rejects payloads that are not the shape it expects', async () => {
    expect((await patch('not json')).status).toBe(400);
    expect((await patch({ ...validBody, availableNow: 'yes' })).status).toBe(400);
    expect((await patch({ ...validBody, timezone: 'Mars/Olympus' })).status).toBe(400);
    expect((await patch({ ...validBody, days: ['someday'] })).status).toBe(400);
    expect((await patch({ ...validBody, startsAt: '9am' })).status).toBe(400);
    expect((await patch({ ...validBody, startsAt: '18:00', endsAt: '09:00' })).status).toBe(400);
    expect((await patch({ ...validBody, exceptions: 'none' })).status).toBe(400);
    expect((await patch({ ...validBody, exceptions: [{ date: '25/12/2026', available: false }] })).status).toBe(400);
    expect((await patch({ ...validBody, exceptions: [{ date: '2031-02-31', available: false }] })).status).toBe(400);
    expect((await patch({ ...validBody, exceptions: [{ date: '2031-12-25', available: 'no' }] })).status).toBe(400);

    expect(connectMock).not.toHaveBeenCalled();
  });

  it('saves the dated overrides beside the weekly pattern', async () => {
    const response = await patch({
      ...validBody,
      exceptions: [
        { date: '2031-12-25', available: false },
        { date: '2031-11-21', available: true },
        { date: '2031-12-25', available: false },
      ],
    });

    expect(response.status).toBe(200);

    const [, freelancerParams] = client.query.mock.calls[2] as [string, unknown[]];
    expect(JSON.parse(freelancerParams[1] as string)).toEqual({
      ...stored,
      exceptions: [
        { date: '2031-11-21', available: true },
        { date: '2031-12-25', available: false },
      ],
    });
  });

  it('drops dates that have already gone by', async () => {
    expect(
      (
        await patch({
          ...validBody,
          exceptions: [
            { date: '2020-01-01', available: false },
            { date: '2031-12-25', available: false },
          ],
        })
      ).status
    ).toBe(200);

    const [, freelancerParams] = client.query.mock.calls[2] as [string, unknown[]];
    expect(JSON.parse(freelancerParams[1] as string).exceptions).toEqual([{ date: '2031-12-25', available: false }]);
  });

  it('writes the switch and the pattern for both role rows', async () => {
    const response = await patch(validBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true });

    const [begin] = client.query.mock.calls[0] as [string];
    expect(begin).toBe('BEGIN');

    const [userSql, userParams] = client.query.mock.calls[1] as [string, unknown[]];
    expect(userSql).toContain('SET available_now = $2');
    expect(userParams).toEqual(['clerk-1', true]);

    const [freelancerSql, freelancerParams] = client.query.mock.calls[2] as [string, unknown[]];
    expect(freelancerSql).toContain('UPDATE freelancers');
    expect(JSON.parse(freelancerParams[1] as string)).toEqual(stored);

    const [editorSql] = client.query.mock.calls[3] as [string];
    expect(editorSql).toContain('UPDATE editors');

    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('rolls back when there is no user row yet', async () => {
    client.query.mockResolvedValueOnce({ rowCount: null }).mockResolvedValueOnce({ rowCount: null });

    const response = await patch(validBody);

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('asks for a finished role when neither role row exists', async () => {
    client.query
      .mockResolvedValueOnce({ rowCount: null })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const response = await patch(validBody);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'role_required' });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('still saves when only the editor row exists', async () => {
    client.query
      .mockResolvedValueOnce({ rowCount: null })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });

    expect((await patch(validBody)).status).toBe(200);
    expect(client.query).toHaveBeenLastCalledWith('COMMIT');
  });

  it('rolls back and reports a failure when the write blows up', async () => {
    client.query.mockResolvedValueOnce({ rowCount: null }).mockRejectedValueOnce(new Error('db down'));

    const response = await patch(validBody);

    expect(response.status).toBe(500);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
