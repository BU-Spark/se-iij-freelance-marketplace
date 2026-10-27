/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/db', () => ({ db: { connect: jest.fn() } }));

const authMock = auth as unknown as jest.Mock;
const connectMock = db.connect as jest.Mock;

type FakeClient = { query: jest.Mock; release: jest.Mock };

type FakeClientOptions = {
  /** Row returned by the users/editors lookup, or undefined when onboarding is incomplete */
  author?: { id: string; role: string; organization_id: string | null };
  /** Error thrown by the INSERT, e.g. a unique violation */
  insertError?: unknown;
};

function makeClient({ author, insertError }: FakeClientOptions = {}): FakeClient {
  const query = jest.fn(async (sql: string) => {
    if (sql.includes('FROM users')) return { rows: author ? [author] : [] };
    if (sql.includes('INSERT INTO assignments')) {
      if (insertError) throw insertError;
      return { rows: [{ id: 'assignment-1' }] };
    }
    return { rows: [] };
  });

  return { query, release: jest.fn() };
}

const validAssignment = {
  title: 'City council overnight vote',
  description: 'Live coverage of the overnight session.',
  category: 'Reporting/Writing',
  slug: 'city-council-overnight',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: '2026-11-01T23:00:00.000Z',
  compensation: '$750 flat',
};

const post = (body: unknown) =>
  new Request('http://localhost/api/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const editor = { id: 'user-1', role: 'editor', organization_id: 'org-1' };

describe('POST /api/assignments', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await POST(post(validAssignment));

    expect(response.status).toBe(401);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('rejects invalid fields before touching the database', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });

    const response = await POST(post({ ...validAssignment, slug: 'Not A Slug' }));

    expect(response.status).toBe(400);
    expect((await response.json()).errors.slug).toBe('Use lowercase letters, numbers, and single hyphens.');
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('asks the editor to finish onboarding first', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient({ author: undefined });
    connectMock.mockResolvedValue(client);

    const response = await POST(post(validAssignment));

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Finish onboarding before creating an assignment.');
    expect(payload.code).toBe('onboarding_required');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('only lets editors create assignments', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient({ author: { id: 'user-2', role: 'freelancer', organization_id: null } });
    connectMock.mockResolvedValue(client);

    const response = await POST(post(validAssignment));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe('Only editors can create assignments.');
    expect(client.release).toHaveBeenCalled();
  });

  it('stores the assignment under the signed-in editor, ignoring spoofed ids', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient({ author: editor });
    connectMock.mockResolvedValue(client);

    const response = await POST(
      post({ ...validAssignment, createdByUserId: 'attacker', organizationId: 'other-org', status: 'assigned' })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ saved: true, id: 'assignment-1' });

    const insert = client.query.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO assignments'));
    expect(insert[1].slice(0, 2)).toEqual(['org-1', 'user-1']);
    expect(insert[1][9]).toEqual(new Date(validAssignment.deadline));
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('reports a duplicate slug as a conflict', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient({
      author: editor,
      insertError: Object.assign(new Error('duplicate'), { code: '23505' }),
    });
    connectMock.mockResolvedValue(client);

    const response = await POST(post(validAssignment));

    expect(response.status).toBe(409);
    expect((await response.json()).errors.slug).toBe('That slug is already used.');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });
});
