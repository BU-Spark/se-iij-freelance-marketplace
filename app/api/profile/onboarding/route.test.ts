/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { loadProfileRow } from '../../../../lib/profile';
import { GET } from './route';
import type { ProfileRow } from '../../../types/profile.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/profile', () => ({ loadProfileRow: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const rowMock = loadProfileRow as jest.Mock;

const row: ProfileRow = {
  id: 'user-1',
  email: 'sarah@newsroom.example',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  short_bio: 'Local politics reporter',
  long_bio: null,
  photo_key: 'photos/user-1/photo.jpg',
  roles: ['freelancer'],
  preferences: { theme: 'dark', language: 'English', notifications: { email: true, push: false } },
  editor_id: null,
  organization_id: null,
  desks: null,
  job_title: null,
  years_at_desk: null,
  editor_location: null,
  pitch_preferences: null,
  editor_availability: null,
  freelancer_id: 'user-1',
  freelancer_location: 'Bristol, UK',
  rate: '$1.10 / word',
  community_covered: 'Bristol',
  reporting_beats: ['Housing'],
  beat_tags: [],
  work_mediums: ['Reporting'],
  tools: ['Excel'],
  portfolio: [],
  freelancer_availability: {
    days: ['monday', 'tuesday'],
    typicalWorkingWindow: { startsAt: '10:00', endsAt: '16:00' },
  },
};

describe('GET /api/profile/onboarding', () => {
  beforeEach(() => jest.resetAllMocks());

  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await GET()).status).toBe(401);
    expect(rowMock).not.toHaveBeenCalled();
  });

  it('returns 404 when there is no profile to reopen', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    rowMock.mockResolvedValue(null);

    expect((await GET()).status).toBe(404);
  });

  it('returns the saved answers in onboarding shape', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    rowMock.mockResolvedValue(row);

    const body = await (await GET()).json();

    expect(rowMock).toHaveBeenCalledWith('clerk-1');
    expect(body.roles).toEqual(['freelancer']);
    expect(body.data).toMatchObject({
      firstName: 'Sarah',
      email: 'sarah@newsroom.example',
      photoKey: 'photos/user-1/photo.jpg',
      rateAmount: '1.10',
      rateUnit: 'word',
      reportingBeats: ['Housing'],
      theme: 'dark',
      availableDays: ['monday', 'tuesday'],
    });
  });

  it('returns 500 when the lookup fails', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    rowMock.mockRejectedValue(new Error('db down'));

    expect((await GET()).status).toBe(500);
  });
});
