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

  it('returns what the freelancer last saved', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          available_now: true,
          availability: {
            timezone: 'Europe/London',
            days: ['monday', 'tuesday'],
            typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
          },
        },
      ],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      availableNow: true,
      timezone: 'Europe/London',
      days: ['monday', 'tuesday'],
      startsAt: '09:00',
      endsAt: '17:00',
    });
  });

  it('gives nulls when nothing has been set yet', async () => {
    queryMock.mockResolvedValue({ rows: [{ available_now: null, availability: null }] });

    expect(await (await GET()).json()).toEqual({
      availableNow: false,
      timezone: null,
      days: [],
      startsAt: null,
      endsAt: null,
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

    expect(connectMock).not.toHaveBeenCalled();
  });

  it('saves the switch and the weekly pattern together', async () => {
    const response = await patch(validBody);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ saved: true, availableNow: true, timezone: 'Europe/London' });

    const [begin] = client.query.mock.calls[0] as [string];
    expect(begin).toBe('BEGIN');

    const [userSql, userParams] = client.query.mock.calls[1] as [string, unknown[]];
    expect(userSql).toContain('SET available_now = $2');
    expect(userParams).toEqual(['clerk-1', true]);

    const [freelancerSql, freelancerParams] = client.query.mock.calls[2] as [string, unknown[]];
    expect(freelancerSql).toContain('SET availability = $2::jsonb');
    expect(JSON.parse(freelancerParams[1] as string)).toEqual({
      timezone: 'Europe/London',
      days: ['monday', 'tuesday'],
      typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
    });

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

  it('refuses editors, who have no freelancer row', async () => {
    client.query
      .mockResolvedValueOnce({ rowCount: null })
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    const response = await patch(validBody);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'freelancer_required' });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('rolls back and reports a failure when the write blows up', async () => {
    client.query.mockResolvedValueOnce({ rowCount: null }).mockRejectedValueOnce(new Error('db down'));

    const response = await patch(validBody);

    expect(response.status).toBe(500);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
