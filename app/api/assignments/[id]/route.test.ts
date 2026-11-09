/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../../lib/db';
import { getAssignment, loadAssignmentViewer } from '../../../../lib/assignments';
import type { Assignment } from '../../../types/assignments.types';
import { PATCH } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../../lib/assignments', () => ({
  ...jest.requireActual('../../../../lib/assignments'),
  getAssignment: jest.fn(),
  loadAssignmentViewer: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const queryMock = db.query as jest.Mock;
const getAssignmentMock = getAssignment as jest.Mock;
const loadViewerMock = loadAssignmentViewer as jest.Mock;

const existing: Assignment = {
  id: 'assignment-1',
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

const edit = {
  title: 'Election night, updated',
  description: 'Now with a sidebar',
  category: 'Editing',
  slug: 'someone-tried-to-change-this',
  contact: 'Alex Desk',
  location: 'City hall',
  length: '1200',
  time: '5',
  deadline: '2030-01-02T04:00:00.000Z',
  compensation: '900',
};

const patch = (body: unknown) =>
  PATCH(
    new Request('http://localhost/api/assignments/assignment-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: 'assignment-1' }) }
  );

describe('PATCH /api/assignments/[id]', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    getAssignmentMock.mockResolvedValue(existing);
    loadViewerMock.mockResolvedValue({ userId: 'user-2', roles: ['editor'], organizationId: 'org-1' });
    queryMock.mockResolvedValue({ rowCount: 1, rows: [{ id: 'assignment-1' }] });
  });

  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await patch(edit);

    expect(response.status).toBe(401);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const response = await patch('{nope');

    expect(response.status).toBe(400);
  });

  it('saves the edit for an editor from the posting organization, keeping the original slug', async () => {
    const response = await patch(edit);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ saved: true, id: 'assignment-1' });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('UPDATE assignments');
    expect(sql).not.toContain('slug');
    expect(params).toEqual([
      'assignment-1',
      'Election night, updated',
      'Now with a sidebar',
      'Editing',
      'Alex Desk',
      'City hall',
      '1200 words / 5 hours',
      new Date('2030-01-02T04:00:00.000Z'),
      '900',
    ]);
  });

  it('answers 404 to editors from another organization', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-3', roles: ['editor'], organizationId: 'org-2' });

    const response = await patch(edit);

    expect(response.status).toBe(404);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('answers 404 to freelancers', async () => {
    loadViewerMock.mockResolvedValue({ userId: 'user-4', roles: ['freelancer'], organizationId: null });

    const response = await patch(edit);

    expect(response.status).toBe(404);
  });

  it('answers 404 when the assignment does not exist', async () => {
    getAssignmentMock.mockResolvedValue(null);

    const response = await patch(edit);

    expect(response.status).toBe(404);
  });

  it('rejects invalid fields', async () => {
    const response = await patch({ ...edit, title: '  ' });

    expect(response.status).toBe(400);
    expect((await response.json()).errors.title).toBeDefined();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('reports a database failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    queryMock.mockRejectedValue(new Error('down'));

    const response = await patch(edit);

    expect(response.status).toBe(500);
  });
});
