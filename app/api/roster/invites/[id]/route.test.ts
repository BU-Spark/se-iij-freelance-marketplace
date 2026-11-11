/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { loadProfileRoles } from '../../../../../lib/profile';
import { removeFromRoster } from '../../../../../lib/roster';
import { DELETE } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/profile', () => ({ loadProfileRoles: jest.fn() }));
jest.mock('../../../../../lib/roster', () => ({ removeFromRoster: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const rolesMock = loadProfileRoles as unknown as jest.Mock;
const removeMock = removeFromRoster as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const ID = '3f1b0c4e-2f6b-4f2c-9d1a-0e5b7c8d9e10';

const remove = (id = ID) =>
  DELETE(new Request(`http://localhost/api/roster/invites/${id}`, { method: 'DELETE' }), {
    params: Promise.resolve({ id }),
  });

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  rolesMock.mockResolvedValue(['editor']);
  removeMock.mockResolvedValue(true);
});

describe('DELETE /api/roster/invites/[id]', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await remove()).status).toBe(401);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('rejects an id that is not an account id', async () => {
    expect((await remove('not-a-uuid')).status).toBe(400);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('refuses anyone without the editor role', async () => {
    rolesMock.mockResolvedValue(['freelancer']);

    expect((await remove()).status).toBe(403);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('does not guess when the roles cannot be read', async () => {
    rolesMock.mockRejectedValue(new Error('db down'));

    expect((await remove()).status).toBe(500);
    expect(removeMock).not.toHaveBeenCalled();
  });

  it('takes the freelancer off the roster', async () => {
    const response = await remove();

    expect(response.status).toBe(200);
    expect(removeMock).toHaveBeenCalledWith('clerk-1', ID);
    expect(await response.json()).toEqual({ removed: true });
  });

  it('answers 404 for someone who is not on the roster', async () => {
    removeMock.mockResolvedValue(false);

    expect((await remove()).status).toBe(404);
  });

  it('asks people to finish onboarding when there is no roster owner yet', async () => {
    removeMock.mockResolvedValue(null);

    const response = await remove();

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
  });

  it('reports a failure instead of pretending the removal landed', async () => {
    removeMock.mockRejectedValue(new Error('db down'));

    const response = await remove();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to change your roster right now.' });
  });
});
