/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { loadAssignmentViewer } from '../../../../../lib/assignments';
import { applyToAssignment, withdrawApplication } from '../../../../../lib/assignmentResponses';
import { DELETE, PUT } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../../../lib/assignments', () => ({ loadAssignmentViewer: jest.fn() }));
jest.mock('../../../../../lib/assignmentResponses', () => ({
  applyToAssignment: jest.fn(),
  withdrawApplication: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadAssignmentViewer as jest.Mock;
const applyMock = applyToAssignment as jest.Mock;
const withdrawMock = withdrawApplication as jest.Mock;

const ID = '11111111-1111-4111-8111-111111111111';
const context = { params: Promise.resolve({ id: ID }) };
const viewer = { userId: 'freelancer-1', roles: ['freelancer'], organizationId: null };

const put = (body: unknown = { kind: 'interested' }) =>
  PUT(
    new Request(`http://localhost/api/assignments/${ID}/response`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    context
  );

const del = () => DELETE(new Request(`http://localhost/api/assignments/${ID}/response`, { method: 'DELETE' }), context);

beforeEach(() => jest.clearAllMocks());

describe('PUT', () => {
  it('asks signed-out visitors to sign in', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await put();

    expect(response.status).toBe(401);
    expect(applyMock).not.toHaveBeenCalled();
  });

  it('rejects a body that is not an interest', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });

    const response = await put({ kind: 'declined', reasons: ['Timing'] });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Say you are interested in this assignment.' });
    expect(applyMock).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });

    const response = await put('{ not json');

    expect(response.status).toBe(400);
  });

  it('keeps editors out of the freelancer answers', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue({ ...viewer, roles: ['editor'] });

    const response = await put();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Only freelancers answer assignments.' });
    expect(applyMock).not.toHaveBeenCalled();
  });

  it('saves the application and returns the stored answer', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue(viewer);
    const saved = { kind: 'interested', at: '2026-01-02T03:04:05.000Z' };
    applyMock.mockResolvedValue(saved);

    const response = await put();

    expect(response.status).toBe(200);
    expect(applyMock).toHaveBeenCalledWith(ID, 'freelancer-1');
    expect(await response.json()).toEqual({ response: saved });
  });

  it('turns an assignment that is closed or gone away', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue(viewer);
    applyMock.mockResolvedValue(null);

    const response = await put();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'This assignment is no longer taking answers.' });
  });

  it('reports a failed save', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue(viewer);
    applyMock.mockRejectedValue(new Error('down'));

    const response = await put();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to save your answer right now.' });
  });
});

describe('DELETE', () => {
  it('asks signed-out visitors to sign in', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await del();

    expect(response.status).toBe(401);
    expect(withdrawMock).not.toHaveBeenCalled();
  });

  it('withdraws the application', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue(viewer);
    withdrawMock.mockResolvedValue(true);

    const response = await del();

    expect(response.status).toBe(200);
    expect(withdrawMock).toHaveBeenCalledWith(ID, 'freelancer-1');
    expect(await response.json()).toEqual({ withdrawn: true });
  });

  it('keeps editors out of the freelancer answers', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    viewerMock.mockResolvedValue({ ...viewer, roles: ['editor'] });

    const response = await del();

    expect(response.status).toBe(403);
    expect(withdrawMock).not.toHaveBeenCalled();
  });
});
