/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../../../lib/db';
import { assignFreelancer, getAssignment, loadAssignmentViewer } from '../../../../../lib/assignments';
import type { Assignment } from '../../../../types/assignments.types';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../../../lib/assignments', () => ({
  ...jest.requireActual('../../../../../lib/assignments'),
  getAssignment: jest.fn(),
  loadAssignmentViewer: jest.fn(),
  assignFreelancer: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const queryMock = db.query as jest.Mock;
const getAssignmentMock = getAssignment as jest.Mock;
const loadViewerMock = loadAssignmentViewer as jest.Mock;
const assignMock = assignFreelancer as jest.Mock;

const MEMBER = '11111111-1111-4111-8111-111111111111';

const existing: Assignment = {
  id: '22222222-2222-4222-8222-222222222222',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Election night',
  description: '',
  category: 'Reporting/Writing',
  slug: 'election-night-abc123',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: null,
  compensation: '750',
  status: 'open',
  createdAt: new Date('2030-01-01'),
  updatedAt: new Date('2030-01-01'),
};

const post = (body: unknown, id = existing.id) =>
  POST(
    new Request(`http://localhost/api/assignments/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  loadViewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: 'org-1' });
  getAssignmentMock.mockResolvedValue(existing);
  queryMock.mockResolvedValue({ rows: [{ id: MEMBER }], rowCount: 1 });
  assignMock.mockResolvedValue({ ...existing, status: 'assigned', assignedToUserId: MEMBER });
});

describe('POST /api/assignments/[id]/assign', () => {
  it('assigns the freelancer and returns the saved state', async () => {
    const response = await post({ memberId: MEMBER });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      saved: true,
      assignment: { id: existing.id, status: 'assigned', assignedToId: MEMBER },
    });
    expect(assignMock).toHaveBeenCalledWith(existing.id, MEMBER);
  });

  it('only accepts a real freelancer', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 });

    const response = await post({ memberId: MEMBER });

    expect(response.status).toBe(400);
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('rejects a member id that is not a uuid', async () => {
    const response = await post({ memberId: 'marcus' });

    expect(response.status).toBe(400);
    expect(getAssignmentMock).not.toHaveBeenCalled();
  });

  it('will not touch an assignment from another organization', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-2' });

    const response = await post({ memberId: MEMBER });

    expect(response.status).toBe(404);
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('will not let a colleague in the same organization assign someone to it', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-1' });

    const response = await post({ memberId: MEMBER });

    expect(response.status).toBe(404);
    expect(assignMock).not.toHaveBeenCalled();
  });

  it('needs a signed-in editor', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await post({ memberId: MEMBER })).status).toBe(401);
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
  });

  it('says so when the database fails', async () => {
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    assignMock.mockRejectedValue(new Error('db down'));

    const response = await post({ memberId: MEMBER });

    expect(response.status).toBe(500);
    consoleMock.mockRestore();
  });
});
