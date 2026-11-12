/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { listDeskAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import type { Assignment } from '../../types/assignments.types';
import { GET } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/db', () => ({ db: { query: jest.fn(), connect: jest.fn() } }));
jest.mock('../../../lib/assignments', () => ({
  ...jest.requireActual('../../../lib/assignments'),
  loadAssignmentViewer: jest.fn(),
  listDeskAssignments: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const listMock = listDeskAssignments as jest.Mock;
const viewerMock = loadAssignmentViewer as jest.Mock;

const assignment: Assignment = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Second page assignment',
  description: '',
  category: 'Editing',
  slug: 'second-page',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '500 words',
  deadline: null,
  compensation: '500',
  status: 'open',
  createdAt: new Date('2030-01-01'),
  updatedAt: new Date('2030-01-01'),
};

const request = (after?: string) =>
  GET(new Request(`http://localhost/api/assignments${after ? `?after=${after}` : ''}`));

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: 'org-1' });
  listMock.mockResolvedValue({ items: [assignment], nextCursor: 'next-id' });
});

describe('GET /api/assignments', () => {
  it('returns the next page in desk shape', async () => {
    const response = await request('last-id');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [expect.objectContaining({ id: assignment.id, title: assignment.title, status: 'open' })],
      nextCursor: 'next-id',
    });
    expect(listMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }), { after: 'last-id' });
  });

  it('treats a missing cursor as the first page', async () => {
    await request();

    expect(listMock).toHaveBeenCalledWith(expect.anything(), { after: null });
  });

  it('needs a signed-in viewer', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await request()).status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('says so when the query fails', async () => {
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    listMock.mockRejectedValue(new Error('db down'));

    expect((await request()).status).toBe(500);
    consoleMock.mockRestore();
  });
});
