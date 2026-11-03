/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import { isPhotoStorageConfigured, getSignedPhotoUrl } from '../../../lib/s3';
import { GET, PATCH } from './route';
import type { ProfileRow } from '../../types/profile.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/db', () => ({ db: { query: jest.fn(), connect: jest.fn() } }));
jest.mock('../../../lib/s3', () => ({
  isPhotoStorageConfigured: jest.fn(() => false),
  getSignedPhotoUrl: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const queryMock = db.query as jest.Mock;
const configuredMock = isPhotoStorageConfigured as jest.Mock;
const signedUrlMock = getSignedPhotoUrl as jest.Mock;

const row: ProfileRow = {
  id: 'user-1',
  email: 'sarah@newsroom.example',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  short_bio: 'Local politics reporter',
  long_bio: null,
  photo_key: null,
  roles: ['editor'],
  editor_id: 'user-1',
  organization_id: 'meridian',
  desks: ['Politics'],
  job_title: 'News Editor',
  years_at_desk: 4,
  editor_location: 'Leeds, UK',
  pitch_preferences: { preferredPitchFormat: 'Email', averageResponseTime: 3 },
  editor_availability: null,
  freelancer_id: null,
  freelancer_location: null,
  rate: null,
  community_covered: null,
  reporting_beats: null,
  beat_tags: null,
  work_mediums: null,
  tools: null,
  freelancer_availability: null,
};

describe('GET /api/profile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    configuredMock.mockReturnValue(false);
  });

  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has not onboarded', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    queryMock.mockResolvedValue({ rows: [] });

    expect((await GET()).status).toBe(404);
  });

  it('returns the profile for the signed-in user', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    queryMock.mockResolvedValue({ rows: [row] });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('FROM users u'), ['clerk-1']);
    expect(body.basic).toMatchObject({ firstName: 'Sarah', email: 'sarah@newsroom.example' });
    expect(body.roles[0]).toMatchObject({ role: 'editor', facts: { jobTitle: 'News Editor' } });
  });

  it('signs the photo URL when storage is configured', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    queryMock.mockResolvedValue({ rows: [{ ...row, photo_key: 'photos/clerk-1/a.jpg' }] });
    configuredMock.mockReturnValue(true);
    signedUrlMock.mockResolvedValue('https://signed.example/a.jpg');

    expect((await (await GET()).json()).basic.photoUrl).toBe('https://signed.example/a.jpg');
  });

  it('still returns the profile when the photo cannot be signed', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    queryMock.mockResolvedValue({ rows: [{ ...row, photo_key: 'photos/clerk-1/a.jpg' }] });
    configuredMock.mockReturnValue(true);
    signedUrlMock.mockRejectedValue(new Error('bucket down'));

    expect((await (await GET()).json()).basic.photoUrl).toBeUndefined();
  });

  it('returns 500 when the lookup fails', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    queryMock.mockRejectedValue(new Error('db down'));

    expect((await GET()).status).toBe(500);
  });
});

type QueryStep = { rowCount?: number; rows?: unknown[]; error?: unknown };

/** A pool client that answers the statements the handler sends, in order */
function makeClient(steps: QueryStep[] = []) {
  const pending = [...steps];
  const query = jest.fn(async (sql: string) => {
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql.trim())) return { rowCount: 0, rows: [] };

    const step = pending.shift();
    if (step?.error) throw step.error;
    if (sql.includes('array_append')) return { rowCount: step?.rowCount ?? 1, rows: [] };
    if (sql.includes('SELECT 1 FROM users')) return { rowCount: step?.rowCount ?? 1, rows: [] };
    if (sql.includes('UPDATE users')) return { rowCount: step?.rowCount ?? 1, rows: [{ id: 'user-1' }] };
    return { rowCount: step?.rowCount ?? 1, rows: step?.rows ?? [] };
  });

  return { query, release: jest.fn() };
}

const connectMock = db.connect as jest.Mock;

const patch = (body: unknown) =>
  new Request('http://localhost/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    configuredMock.mockReturnValue(false);
  });

  it('rejects anonymous requests and unusable bodies', async () => {
    authMock.mockResolvedValue({ userId: null });
    expect((await PATCH(patch({ section: 'role', role: 'editor', facts: {} }))).status).toBe(401);
    expect(connectMock).not.toHaveBeenCalled();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    connectMock.mockResolvedValue(makeClient());
    expect((await PATCH(patch('{not json'))).status).toBe(400);
    expect((await PATCH(patch({ section: 'nonsense' }))).status).toBe(400);
  });

  it('saves basic info and returns the refreshed profile', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [row] });
    const response = await PATCH(
      patch({
        section: 'basic',
        basic: { firstName: 'Sarah', lastName: 'Jenkins', email: 'sarah@newsroom.example', shortBio: 'Hi' },
      })
    );
    expect(response.status).toBe(200);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('SET first_name = $2'), [
      'clerk-1',
      'Sarah',
      'Jenkins',
      'sarah@newsroom.example',
      'Hi',
      null,
    ]);
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('rejects basic info without a first name', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient();
    connectMock.mockResolvedValue(client);
    const response = await PATCH(patch({ section: 'basic', basic: { firstName: ' ', email: 'a@b.co' } }));
    expect(response.status).toBe(400);
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('upserts the editor role and adds it to users.roles', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [row] });
    const response = await PATCH(
      patch({
        section: 'role',
        role: 'editor',
        facts: { organizationId: 'meridian', jobTitle: 'News Editor', desks: ['Politics'], yearsAtDesk: '4' },
      })
    );
    expect(response.status).toBe(200);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO editors'), [
      'clerk-1',
      'meridian',
      ['Politics'],
      'News Editor',
      4,
      null,
      expect.stringContaining('"preferredPitchFormat"'),
    ]);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('array_append'), ['clerk-1', 'editor']);
  });

  it('upserts the freelancer role', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [row] });
    const response = await PATCH(
      patch({ section: 'role', role: 'freelancer', facts: { location: 'Bristol', tools: ['Excel'] } })
    );
    expect(response.status).toBe(200);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO freelancers'), [
      'clerk-1',
      'Bristol',
      null,
      null,
      [],
      [],
      [],
      ['Excel'],
    ]);
  });

  it('rolls back and reports a missing user or a failed write', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const basic = { section: 'basic', basic: { firstName: 'Sarah', email: 'a@b.co' } };
    const missingUser = makeClient([{ rowCount: 0 }]);
    connectMock.mockResolvedValue(missingUser);
    expect((await PATCH(patch(basic))).status).toBe(404);
    expect(missingUser.query).toHaveBeenCalledWith('ROLLBACK');
    const failing = makeClient([{ error: new Error('deadlock') }]);
    connectMock.mockResolvedValue(failing);
    expect((await PATCH(patch(basic))).status).toBe(500);
    expect(failing.query).toHaveBeenCalledWith('ROLLBACK');
    expect(failing.release).toHaveBeenCalled();
  });
});

describe('PATCH /api/profile — adding a role', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    configuredMock.mockReturnValue(false);
  });

  it('appends the role to users.roles without creating the role row', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [row] });

    expect((await PATCH(patch({ section: 'addRole', role: 'freelancer' }))).status).toBe(200);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('array_append'), ['clerk-1', 'freelancer']);
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'));
  });

  it('is idempotent when the person already has the role', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    const client = makeClient([{ rowCount: 0 }]);
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [row] });

    expect((await PATCH(patch({ section: 'addRole', role: 'editor' }))).status).toBe(200);
    expect(client.query).toHaveBeenCalledWith('SELECT 1 FROM users WHERE clerk_id = $1', ['clerk-1']);
  });
});
