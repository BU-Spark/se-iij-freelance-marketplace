/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import { isPhotoStorageConfigured, getSignedPhotoUrl } from '../../../lib/s3';
import { GET } from './route';
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
