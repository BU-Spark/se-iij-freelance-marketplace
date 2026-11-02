/**
 * @jest-environment node
 */
import { db } from './db';
import { listOpenAssignments } from './assignments';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const row = {
  id: 'assignment-1',
  organization_id: 'org-1',
  created_by_user_id: 'user-1',
  title: 'Election night',
  description: 'Live coverage',
  category: 'Reporting/Writing',
  slug: 'election-night',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: new Date('2026-11-01T23:00:00.000Z'),
  compensation: '750',
  status: 'open',
  created_at: new Date('2026-10-01T12:00:00.000Z'),
  updated_at: new Date('2026-10-02T12:00:00.000Z'),
};

describe('listOpenAssignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('selects only open assignments and maps them to the app model', async () => {
    queryMock.mockResolvedValue({ rows: [row] });

    const assignments = await listOpenAssignments();

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('FROM assignments');
    expect(sql).toContain("WHERE status = 'open'");
    expect(assignments).toEqual([
      {
        id: 'assignment-1',
        organizationId: 'org-1',
        createdByUserId: 'user-1',
        title: 'Election night',
        description: 'Live coverage',
        category: 'Reporting/Writing',
        slug: 'election-night',
        contact: 'Sam Desk',
        location: 'Remote',
        length: '800 words',
        deadline: new Date('2026-11-01T23:00:00.000Z'),
        compensation: '750',
        status: 'open',
        createdAt: new Date('2026-10-01T12:00:00.000Z'),
        updatedAt: new Date('2026-10-02T12:00:00.000Z'),
      },
    ]);
  });

  it('keeps a missing deadline as null', async () => {
    queryMock.mockResolvedValue({ rows: [{ ...row, deadline: null }] });

    const [assignment] = await listOpenAssignments();

    expect(assignment.deadline).toBeNull();
  });
});
