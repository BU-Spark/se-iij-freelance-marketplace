/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { loadAssignmentViewer } from '../../../../lib/assignments';
import { listAssignmentResponses } from '../../../../lib/assignmentResponses';
import { GET } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../../lib/assignments', () => ({ loadAssignmentViewer: jest.fn() }));
jest.mock('../../../../lib/assignmentResponses', () => ({ listAssignmentResponses: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadAssignmentViewer as jest.Mock;
const listMock = listAssignmentResponses as jest.Mock;

const viewer = { userId: 'freelancer-1', roles: ['freelancer'], organizationId: null };

beforeEach(() => jest.clearAllMocks());

it('asks signed-out visitors to sign in', async () => {
  authMock.mockResolvedValue({ userId: null });

  const response = await GET();

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: 'You must be signed in to see your answers.' });
  expect(viewerMock).not.toHaveBeenCalled();
});

it('sends people who have not onboarded back to onboarding', async () => {
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue(null);

  const response = await GET();

  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
});

it('keeps editors out of the freelancer answers', async () => {
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue({ ...viewer, roles: ['editor'] });

  const response = await GET();

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: 'Only freelancers answer assignments.' });
  expect(listMock).not.toHaveBeenCalled();
});

it("returns the freelancer's own answers", async () => {
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue(viewer);
  const responses = { 'assignment-1': { kind: 'interested', at: '2026-01-02T03:04:05.000Z' } };
  listMock.mockResolvedValue(responses);

  const response = await GET();

  expect(response.status).toBe(200);
  expect(listMock).toHaveBeenCalledWith('freelancer-1');
  expect(await response.json()).toEqual({ responses });
});

it('reports a failed lookup instead of pretending there are no answers', async () => {
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue(viewer);
  listMock.mockRejectedValue(new Error('down'));

  const response = await GET();

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: 'Unable to load your answers right now.' });
});
