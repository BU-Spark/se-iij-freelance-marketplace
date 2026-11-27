/**
 * @jest-environment node
 */
import { db } from './db';
import {
  applyToAssignment,
  listApplicantsFor,
  listAssignmentResponses,
  withdrawApplication,
} from './assignmentResponses';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const ASSIGNMENT = '11111111-1111-4111-8111-111111111111';
const FREELANCER = '22222222-2222-4222-8222-222222222222';

beforeEach(() => jest.clearAllMocks());

describe('listAssignmentResponses', () => {
  it("maps the freelancer's rows to interested answers", async () => {
    queryMock.mockResolvedValue({
      rows: [{ assignment_id: ASSIGNMENT, created_at: new Date('2026-01-02T03:04:05.000Z') }],
    });

    const responses = await listAssignmentResponses(FREELANCER);

    expect(String(queryMock.mock.calls[0][0])).toContain('FROM assignment_responses');
    expect(queryMock.mock.calls[0][1]).toEqual([FREELANCER]);
    expect(responses).toEqual({
      [ASSIGNMENT]: { kind: 'interested', at: '2026-01-02T03:04:05.000Z' },
    });
  });

  it('does not query for an id that is not a UUID', async () => {
    await expect(listAssignmentResponses('not-a-uuid')).resolves.toEqual({});
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('applyToAssignment', () => {
  it('inserts only for an open assignment and returns when it was saved', async () => {
    queryMock.mockResolvedValue({ rows: [{ updated_at: '2026-01-02T03:04:05.000Z' }] });

    const response = await applyToAssignment(ASSIGNMENT, FREELANCER);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('INSERT INTO assignment_responses');
    expect(sql).toContain("WHERE a.id = $1 AND a.status = 'open'");
    expect(sql).toContain('ON CONFLICT (assignment_id, freelancer_user_id)');
    expect(response).toEqual({ kind: 'interested', at: '2026-01-02T03:04:05.000Z' });
  });

  it('answers null when the assignment is missing or no longer open', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(applyToAssignment(ASSIGNMENT, FREELANCER)).resolves.toBeNull();
  });

  it('skips the database when either id is not a UUID', async () => {
    await expect(applyToAssignment('nope', FREELANCER)).resolves.toBeNull();
    await expect(applyToAssignment(ASSIGNMENT, 'nope')).resolves.toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('withdrawApplication', () => {
  it('removes the row and reports whether it existed', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    await expect(withdrawApplication(ASSIGNMENT, FREELANCER)).resolves.toBe(true);

    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    await expect(withdrawApplication(ASSIGNMENT, FREELANCER)).resolves.toBe(false);

    expect(String(queryMock.mock.calls[0][0])).toContain('DELETE FROM assignment_responses');
    expect(queryMock.mock.calls[0][1]).toEqual([ASSIGNMENT, FREELANCER]);
  });
});

describe('listApplicantsFor', () => {
  it('groups applicants by assignment, keeping people who are not on the roster', async () => {
    queryMock.mockResolvedValue({
      rows: [
        { assignment_id: ASSIGNMENT, id: 'user-1', name: 'Amara Okafor', city: 'Lagos' },
        { assignment_id: ASSIGNMENT, id: 'user-2', name: 'Sam Reed', city: null },
      ],
    });

    const applicants = await listApplicantsFor([ASSIGNMENT]);

    expect(String(queryMock.mock.calls[0][0])).toContain('LEFT JOIN freelancers');
    expect(queryMock.mock.calls[0][1]).toEqual([[ASSIGNMENT]]);
    expect(applicants).toEqual({
      [ASSIGNMENT]: [
        { id: 'user-1', name: 'Amara Okafor', city: 'Lagos' },
        { id: 'user-2', name: 'Sam Reed', city: '' },
      ],
    });
  });

  it('does not query without assignment ids to look up', async () => {
    await expect(listApplicantsFor([])).resolves.toEqual({});
    await expect(listApplicantsFor(['not-a-uuid'])).resolves.toEqual({});
    expect(queryMock).not.toHaveBeenCalled();
  });
});
