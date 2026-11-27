/**
 * @jest-environment node
 */
import { listOpenAssignments, loadAssignmentViewer } from '../../lib/assignments';
import { listInvitesForFreelancer, loadEditorRoster } from '../../lib/roster';
import { loadInboxSources } from './loadInboxSources';

jest.mock('../../lib/assignments', () => ({ listOpenAssignments: jest.fn(), loadAssignmentViewer: jest.fn() }));
jest.mock('../../lib/roster', () => ({ listInvitesForFreelancer: jest.fn(), loadEditorRoster: jest.fn() }));

const openMock = listOpenAssignments as jest.Mock;
const invitesMock = listInvitesForFreelancer as jest.Mock;
const rosterMock = loadEditorRoster as jest.Mock;

const post = (id: string, daysAgo: number, createdByUserId = 'someone') => ({
  id,
  title: `Story ${id}`,
  createdByUserId,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000),
});

describe('loadInboxSources', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (loadAssignmentViewer as jest.Mock).mockResolvedValue({ userId: 'me', roles: ['freelancer'] });
    openMock.mockResolvedValue([]);
    invitesMock.mockResolvedValue([]);
    rosterMock.mockResolvedValue({ members: [] });
  });

  it('keeps only recent assignments that someone else posted', async () => {
    openMock.mockResolvedValue([post('recent', 1), post('old', 8), post('mine', 1, 'me')]);

    const { newAssignments } = await loadInboxSources('clerk-1', ['freelancer']);

    expect(newAssignments.map(({ id }) => id)).toEqual(['recent']);
    expect(newAssignments[0].editorName).toBe('An editor');
    expect(rosterMock).not.toHaveBeenCalled();
  });

  it('keeps only answers to roster notices the editor sent', async () => {
    rosterMock.mockResolvedValue({
      members: [
        { id: 'yes', name: 'A', notified: true, inviteStatus: 'accepted' },
        { id: 'waiting', name: 'B', notified: true, inviteStatus: 'pending' },
        { id: 'silent', name: 'C', notified: false, inviteStatus: 'accepted' },
      ],
    });

    const { answers } = await loadInboxSources('clerk-1', ['editor']);

    expect(answers.map(({ freelancerId }) => freelancerId)).toEqual(['yes']);
    expect(openMock).not.toHaveBeenCalled();
  });

  it('keeps the rest of the inbox when one read fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    openMock.mockRejectedValue(new Error('ECONNREFUSED'));
    invitesMock.mockResolvedValue([{ editorId: 'e-1', editorName: 'Sam', invitedAt: '2026-11-19', status: 'pending' }]);

    const sources = await loadInboxSources('clerk-1', ['freelancer']);

    expect(sources.newAssignments).toEqual([]);
    expect(sources.savedBy).toEqual([expect.objectContaining({ editorId: 'e-1', answered: false })]);
  });
});
