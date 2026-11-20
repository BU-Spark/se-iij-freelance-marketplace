/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { loadProfileRoles } from '../../../../lib/profile';
import { inviteFreelancers } from '../../../../lib/roster';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/profile', () => ({ loadProfileRoles: jest.fn() }));
jest.mock('../../../../lib/roster', () => ({ inviteFreelancers: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const rolesMock = loadProfileRoles as unknown as jest.Mock;
const inviteMock = inviteFreelancers as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const ID = '3f1b0c4e-2f6b-4f2c-9d1a-0e5b7c8d9e10';
const OTHER = '9b2c3d4e-5f60-4a71-8b92-c3d4e5f60718';

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/roster/invites', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  rolesMock.mockResolvedValue(['editor']);
  inviteMock.mockResolvedValue({
    saved: [{ freelancerId: ID, invitedAt: '2026-11-11T09:00:00.000Z', status: 'accepted', notified: false }],
  });
});

describe('POST /api/roster/invites', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await post({ freelancerIds: [ID] });

    expect(response.status).toBe(401);
    expect(inviteMock).not.toHaveBeenCalled();
  });

  it('refuses freelancers and anyone without the editor role', async () => {
    rolesMock.mockResolvedValue(['freelancer']);

    const response = await post({ freelancerIds: [ID] });

    expect(response.status).toBe(403);
    expect(inviteMock).not.toHaveBeenCalled();
  });

  it('does not guess when the roles cannot be read', async () => {
    rolesMock.mockRejectedValue(new Error('db down'));

    const response = await post({ freelancerIds: [ID] });

    expect(response.status).toBe(500);
    expect(inviteMock).not.toHaveBeenCalled();
  });

  it('needs a non-empty list of real account ids', async () => {
    expect((await post({ freelancerIds: [] })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect((await post('not json')).status).toBe(400);
    expect((await post({ freelancerIds: ['not-a-uuid'] })).status).toBe(400);
    expect((await post({ freelancerIds: Array.from({ length: 51 }, () => ID) })).status).toBe(400);

    expect(inviteMock).not.toHaveBeenCalled();
  });

  it('saves the chosen freelancers to the signed-in editor roster', async () => {
    const response = await post({ freelancerIds: [ID, OTHER] });

    expect(response.status).toBe(200);
    expect(inviteMock).toHaveBeenCalledWith('clerk-1', [ID, OTHER], false);
    expect(await response.json()).toEqual({
      saved: [{ freelancerId: ID, invitedAt: '2026-11-11T09:00:00.000Z', status: 'accepted', notified: false }],
    });
  });

  it('passes the optional notification choice through', async () => {
    const response = await post({ freelancerIds: [ID], notify: true });

    expect(response.status).toBe(200);
    expect(inviteMock).toHaveBeenCalledWith('clerk-1', [ID], true);
  });

  it('asks people to finish onboarding when there is no roster owner yet', async () => {
    inviteMock.mockResolvedValue(null);

    const response = await post({ freelancerIds: [ID] });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
  });

  it('reports a failure instead of pretending the invite landed', async () => {
    inviteMock.mockRejectedValue(new Error('db down'));

    const response = await post({ freelancerIds: [ID] });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to add to your roster right now.' });
  });
});
