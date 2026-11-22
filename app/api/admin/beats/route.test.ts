/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { addBeat } from '../../../../lib/beats';
import { isSignedInUserAdmin } from '../../../../lib/auth';
import { POST } from './route';
import type { Beat } from '../../../types/admin.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../../../lib/beats', () => ({
  addBeat: jest.fn(),
  MAX_BEAT_NAME_LENGTH: 60,
}));

const authMock = auth as unknown as jest.Mock;
const adminMock = isSignedInUserAdmin as unknown as jest.Mock;
const addMock = addBeat as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const beat: Beat = { id: '11111111-1111-4111-8111-111111111111', name: 'Water rights', sortOrder: 42 };

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/admin/beats', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  adminMock.mockResolvedValue(true);
  addMock.mockResolvedValue({ status: 'added', beat });
});

describe('POST /api/admin/beats', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await post({ name: 'Water rights' });

    expect(response.status).toBe(401);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('refuses people outside the Story Match team', async () => {
    adminMock.mockResolvedValue(false);

    const response = await post({ name: 'Water rights' });

    expect(response.status).toBe(403);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('fails closed when the admin check blows up', async () => {
    adminMock.mockRejectedValue(new Error('clerk down'));

    const response = await post({ name: 'Water rights' });

    expect(response.status).toBe(403);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('rejects a non-JSON body, a missing name and a blank name', async () => {
    expect((await post('not json')).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post({ name: '   ' })).status).toBe(400);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('rejects a name that is too long or reserved for the "Other" option', async () => {
    expect((await post({ name: 'a'.repeat(61) })).status).toBe(400);
    expect((await post({ name: 'other/not listed here' })).status).toBe(400);
    expect(addMock).not.toHaveBeenCalled();
  });

  it('trims the name before saving it', async () => {
    const response = await post({ name: '  Water rights  ' });

    expect(response.status).toBe(201);
    expect(addMock).toHaveBeenCalledWith('Water rights');
    expect(await response.json()).toEqual({ beat });
  });

  it('answers 409 when the beat is already offered', async () => {
    addMock.mockResolvedValue({ status: 'exists' });

    const response = await post({ name: 'politics' });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'That beat is already on the list.' });
  });

  it('reports a failure when the beat cannot be saved', async () => {
    addMock.mockRejectedValue(new Error('db down'));

    const response = await post({ name: 'Water rights' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to add this beat right now.' });
  });
});
