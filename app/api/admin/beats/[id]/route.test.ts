/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { removeBeat } from '../../../../../lib/beats';
import { isSignedInUserAdmin } from '../../../../../lib/auth';
import { DELETE } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../../../../lib/beats', () => ({ removeBeat: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const adminMock = isSignedInUserAdmin as unknown as jest.Mock;
const removeMock = removeBeat as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const BEAT_ID = '11111111-1111-4111-8111-111111111111';

const remove = (id = BEAT_ID) =>
  DELETE(new Request(`http://localhost/api/admin/beats/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  });

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  adminMock.mockResolvedValue(true);
  removeMock.mockResolvedValue(true);
});

describe('DELETE /api/admin/beats/[id]', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await remove();

    expect(response.status).toBe(401);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('refuses people outside the Story Match team', async () => {
    adminMock.mockResolvedValue(false);

    const response = await remove();

    expect(response.status).toBe(403);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('fails closed when the admin check blows up', async () => {
    adminMock.mockRejectedValue(new Error('clerk down'));

    const response = await remove();

    expect(response.status).toBe(403);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('answers 404 for a beat that does not exist', async () => {
    removeMock.mockResolvedValue(false);

    const response = await remove();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Beat not found.' });
  });

  it('removes the beat', async () => {
    const response = await remove();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ removed: true });
    expect(removeMock).toHaveBeenCalledWith(BEAT_ID);
  });

  it('reports a failure when the beat cannot be removed', async () => {
    removeMock.mockRejectedValue(new Error('db down'));

    const response = await remove();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to remove this beat right now.' });
  });
});
