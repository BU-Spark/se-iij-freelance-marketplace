/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { setFlagStatus } from '../../../../../lib/flags';
import { isSignedInUserAdmin } from '../../../../../lib/auth';
import { PATCH } from './route';
import type { FlagReport } from '../../../../types/admin.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../../../../lib/flags', () => ({ setFlagStatus: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const adminMock = isSignedInUserAdmin as unknown as jest.Mock;
const setStatusMock = setFlagStatus as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const FLAG_ID = '11111111-1111-4111-8111-111111111111';

const flag: FlagReport = {
  id: FLAG_ID,
  targetType: 'assignment',
  targetId: '22222222-2222-4222-8222-222222222222',
  targetLabel: 'Transit strike explainer',
  reason: 'Pay is below the posted minimum.',
  reporterName: 'Ada Editor',
  status: 'resolved',
  createdAt: '2026-11-10T09:00:00.000Z',
};

const patch = (body: unknown, id = FLAG_ID) =>
  PATCH(
    new Request(`http://localhost/api/admin/flags/${id}`, {
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  adminMock.mockResolvedValue(true);
  setStatusMock.mockResolvedValue(flag);
});

describe('PATCH /api/admin/flags/[id]', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await patch({ status: 'resolved' });

    expect(response.status).toBe(401);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('refuses people outside the Story Match team', async () => {
    adminMock.mockResolvedValue(false);

    const response = await patch({ status: 'resolved' });

    expect(response.status).toBe(403);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('fails closed when the admin check blows up', async () => {
    adminMock.mockRejectedValue(new Error('clerk down'));

    const response = await patch({ status: 'resolved' });

    expect(response.status).toBe(403);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown status or a non-JSON body', async () => {
    expect((await patch({ status: 'archived' })).status).toBe(400);
    expect((await patch('not json')).status).toBe(400);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('answers 404 for a flag that does not exist', async () => {
    setStatusMock.mockResolvedValue(null);

    const response = await patch({ status: 'dismissed' });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Flag not found.' });
  });

  it('returns the updated flag', async () => {
    const response = await patch({ status: 'resolved' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ flag });
    expect(setStatusMock).toHaveBeenCalledWith(FLAG_ID, 'resolved');
  });

  it('reports a failure when the flag cannot be saved', async () => {
    setStatusMock.mockRejectedValue(new Error('db down'));

    const response = await patch({ status: 'resolved' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to update this flag right now.' });
  });
});
