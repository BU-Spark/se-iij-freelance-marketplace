/**
 * @jest-environment node
 */
import { db } from './db';
import {
  canEditAssignment,
  canViewAssignment,
  countAssignmentsByStatus,
  getAssignment,
  listDeskAssignments,
  listOpenAssignments,
  loadAssignmentViewer,
  toAssignment,
  type AssignmentViewer,
} from './assignments';
import type { Assignment } from '../app/types/assignments.types';

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

describe('listOpenAssignments scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it("limits editors to their own organization's assignments", async () => {
    await listOpenAssignments({ userId: 'user-1', roles: ['editor'], organizationId: 'org-1' });

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('organization_id = $1');
    expect(params).toEqual(['org-1']);
  });

  it('limits editors with no organization yet to their own posts', async () => {
    await listOpenAssignments({ userId: 'user-1', roles: ['editor'], organizationId: null });

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('organization_id IS NULL AND created_by_user_id = $1');
    expect(params).toEqual(['user-1']);
  });

  it('shows freelancers every open assignment', async () => {
    await listOpenAssignments({ userId: 'user-2', roles: ['freelancer'], organizationId: null });

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toContain('organization_id =');
    expect(params).toBeUndefined();
  });
});

describe('listDeskAssignments scoping', () => {
  const editor: AssignmentViewer = { userId: 'user-1', roles: ['editor'], organizationId: 'org-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    queryMock.mockResolvedValue({ rows: [] });
  });

  it('keeps the desk to the posts the editor wrote, not the whole organization', async () => {
    await listDeskAssignments(editor);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('created_by_user_id = $1');
    expect(sql).not.toContain('organization_id =');
    // creator id, then the page size + 1 that tells us whether there is another page
    expect(params).toEqual(['user-1', 21]);
  });

  it('widens to every post the organization made when asked', async () => {
    await listDeskAssignments(editor, { scope: 'organization' });

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('organization_id = $1');
    expect(params).toEqual(['org-1', 21]);
  });

  it('falls back to the editor\u2019s own posts when they have no organization', async () => {
    await listDeskAssignments(
      { userId: 'user-1', roles: ['editor'], organizationId: null },
      {
        scope: 'organization',
      }
    );

    expect(String(queryMock.mock.calls[0][0])).toContain('created_by_user_id = $1');
  });

  it('counts by the same scope as the list', async () => {
    await countAssignmentsByStatus(editor, 'organization');
    expect(String(queryMock.mock.calls[0][0])).toContain('organization_id = $1');

    jest.clearAllMocks();
    queryMock.mockResolvedValue({ rows: [] });
    await countAssignmentsByStatus(editor);
    expect(String(queryMock.mock.calls[0][0])).toContain('created_by_user_id = $1');
  });
});

describe('creator name', () => {
  // the fixture omits the assignment columns added later, so fill them in for a complete row
  const complete = { ...row, status: row.status as Assignment['status'], assigned_to_user_id: null };

  it('carries the name the query resolved', () => {
    expect(toAssignment({ ...complete, created_by_name: 'Joey Lam' }).createdByName).toBe('Joey Lam');
  });

  it('leaves it undefined when the join found nobody', () => {
    expect(toAssignment({ ...complete, created_by_name: null }).createdByName).toBeUndefined();
  });
});

describe('loadAssignmentViewer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the user id, roles and organization for a Clerk id', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: 'user-1', roles: ['editor'], organization_id: 'org-1' }] });

    await expect(loadAssignmentViewer('clerk-1')).resolves.toEqual({
      userId: 'user-1',
      roles: ['editor'],
      organizationId: 'org-1',
    });
    expect(queryMock.mock.calls[0][1]).toEqual(['clerk-1']);
  });

  it('returns null before onboarding', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(loadAssignmentViewer('clerk-1')).resolves.toBeNull();
  });
});

describe('getAssignment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('skips the database for ids that are not UUIDs', async () => {
    await expect(getAssignment('not-a-uuid')).resolves.toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('loads one assignment by id', async () => {
    const id = '5f0c6a8e-1b2c-4d3e-8f90-1234567890ab';
    queryMock.mockResolvedValue({ rows: [{ ...row, id }] });

    const assignment = await getAssignment(id);

    expect(assignment?.id).toBe(id);
    expect(queryMock.mock.calls[0][1]).toEqual([id]);
  });
});

describe('assignment permissions', () => {
  const assignment = toAssignment(row as Parameters<typeof toAssignment>[0]); // org-1, by user-1
  const editor = (overrides: Partial<AssignmentViewer> = {}): AssignmentViewer => ({
    userId: 'user-9',
    roles: ['editor'],
    organizationId: 'org-1',
    ...overrides,
  });

  it('lets the editor who posted it view and edit', () => {
    expect(canViewAssignment(editor({ userId: 'user-1' }), assignment)).toBe(true);
    expect(canEditAssignment(editor({ userId: 'user-1' }), assignment)).toBe(true);
  });

  it('lets a colleague in the same organization read the post but never edit or delete it', () => {
    expect(canViewAssignment(editor(), assignment)).toBe(true);
    expect(canEditAssignment(editor(), assignment)).toBe(false);
  });

  it('hides assignments from editors at other organizations', () => {
    expect(canViewAssignment(editor({ organizationId: 'org-2' }), assignment)).toBe(false);
    expect(canEditAssignment(editor({ organizationId: 'org-2' }), assignment)).toBe(false);
  });

  it('stops an author from editing once they belong to another organization', () => {
    expect(canEditAssignment(editor({ userId: 'user-1', organizationId: 'org-2' }), assignment)).toBe(false);
  });

  it('stops an author without an organization from editing an organization post', () => {
    expect(canEditAssignment(editor({ userId: 'user-1', organizationId: null }), assignment)).toBe(false);
  });

  it('still lets the author edit a post made before they had an organization', () => {
    const orphan = { ...assignment, organizationId: null };
    expect(canEditAssignment(editor({ userId: 'user-1', organizationId: null }), orphan)).toBe(true);
    expect(canEditAssignment(editor({ userId: 'user-9', organizationId: 'org-1' }), orphan)).toBe(false);
  });

  it("does not let two organization-less editors see each other's posts", () => {
    const orphan = { ...assignment, organizationId: null };
    expect(canViewAssignment(editor({ organizationId: null }), orphan)).toBe(false);
  });

  it('lets freelancers view open assignments but never edit', () => {
    const freelancer: AssignmentViewer = { userId: 'user-5', roles: ['freelancer'], organizationId: null };
    expect(canViewAssignment(freelancer, assignment)).toBe(true);
    expect(canViewAssignment(freelancer, { ...assignment, status: 'assigned' })).toBe(false);
    expect(canEditAssignment(freelancer, assignment)).toBe(false);
  });
});
