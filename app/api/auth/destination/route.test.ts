/**
 * @jest-environment node
 */
import { auth, currentUser } from '@clerk/nextjs/server';
import { GET } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const currentUserMock = currentUser as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/auth/destination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
  });

  it('sends admins to the admin area', async () => {
    currentUserMock.mockResolvedValue({ publicMetadata: { role: 'admin' } });

    const response = await GET();

    expect(await response.json()).toEqual({ redirectTo: '/admin' });
  });

  it('sends everyone else to the app', async () => {
    currentUserMock.mockResolvedValue({ publicMetadata: { roles: ['editor'] } });

    const response = await GET();

    expect(await response.json()).toEqual({ redirectTo: '/dashboard' });
  });

  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ redirectTo: '/login' });
  });

  it('falls back to the app when Clerk fails', async () => {
    currentUserMock.mockRejectedValue(new Error('clerk down'));

    const response = await GET();

    expect(await response.json()).toEqual({ redirectTo: '/dashboard' });
    expect(consoleMock).toHaveBeenCalled();
  });
});
