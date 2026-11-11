import { render, screen, within } from '@testing-library/react';
import AssignmentsPage from './page';
import type { Assignment } from '../../types/assignments.types';
import { getAssignment, listOpenAssignments } from '../../../lib/assignments';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('../../../lib/workspace', () => ({ requireWorkspace: jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock('../../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../../lib/assignments', () => ({
  ...jest.requireActual('../../../lib/assignments'),
  listOpenAssignments: jest.fn(),
  getAssignment: jest.fn(async () => null),
  loadAssignmentViewer: jest.fn(async () => viewer),
}));

const viewer = { userId: 'user-1', roles: ['editor'], organizationId: 'org-1' };

const listOpenAssignmentsMock = listOpenAssignments as jest.Mock;
const getAssignmentMock = getAssignment as jest.Mock;

const assignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'assignment-1',
  organizationId: null,
  createdByUserId: 'user-1',
  title: 'Election night',
  description: '',
  category: 'Reporting/Writing',
  slug: 'election-night',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: new Date(2030, 0, 1, 23, 0),
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
  ...overrides,
});

describe('Assignment discovery page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAssignmentMock.mockResolvedValue(null);
  });

  it('lists the open assignments stored in the database', async () => {
    listOpenAssignmentsMock.mockResolvedValue([
      assignment(),
      assignment({ id: 'assignment-2', title: 'Port authority op-ed', category: 'Editing' }),
    ]);

    render(await AssignmentsPage({}));

    expect(listOpenAssignmentsMock).toHaveBeenCalledTimes(1);
    // scoped to whoever is signed in, so editors only get their organization's posts
    expect(listOpenAssignmentsMock).toHaveBeenCalledWith(viewer);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /port authority/i })).toBeInTheDocument();
  });

  it('links each card to the assignment drawer on this page', async () => {
    listOpenAssignmentsMock.mockResolvedValue([assignment()]);

    render(await AssignmentsPage({}));

    expect(screen.getByRole('link', { name: /election night/i })).toHaveAttribute(
      'href',
      '/dashboard/assignments?assignment=assignment-1'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the clicked assignment in a drawer that closes back to the list', async () => {
    const opened = assignment({ description: 'Live coverage from the county clerk.' });
    listOpenAssignmentsMock.mockResolvedValue([opened]);
    getAssignmentMock.mockResolvedValue(opened);

    render(await AssignmentsPage({ searchParams: Promise.resolve({ assignment: opened.id }) }));

    const drawer = screen.getByRole('dialog', { name: /election night/i });
    expect(within(drawer).getByText('Live coverage from the county clerk.')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/dashboard/assignments');
  });

  it('says so when there are no open assignments yet', async () => {
    listOpenAssignmentsMock.mockResolvedValue([]);

    render(await AssignmentsPage({}));

    expect(screen.getByRole('status')).toHaveTextContent('No open assignments yet');
  });

  it('tells the reader when the database cannot be reached', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    listOpenAssignmentsMock.mockRejectedValue(new Error('database unavailable'));

    render(await AssignmentsPage({}));

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load assignments/i);
  });
});
