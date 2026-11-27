import { render, screen, within } from '@testing-library/react';
import Dashboard from './page';
import type { Assignment } from '../types/assignments.types';
import { SAMPLE_ROSTER as ROSTER } from '../../test/fixtures/roster';
import { countAssignmentsByStatus, getAssignment, listDeskAssignments } from '../../lib/assignments';
import { loadEditorRoster } from '../../lib/roster';

// No real browser URL in tests; pretend there's no "?new=assignment"
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('../../lib/workspace', () => ({ requireWorkspace: jest.fn() }));
jest.mock('../../lib/db', () => ({ db: { query: jest.fn() } }));
jest.mock('../../lib/assignments', () => ({
  ...jest.requireActual('../../lib/assignments'),
  listDeskAssignments: jest.fn(),
  countAssignmentsByStatus: jest.fn(),
  getAssignment: jest.fn(async () => null),
  loadAssignmentViewer: jest.fn(async () => viewer),
}));
jest.mock('../../lib/roster', () => ({ loadEditorRoster: jest.fn() }));
jest.mock('../../lib/assignmentResponses', () => ({ listApplicantsFor: jest.fn(async () => ({})) }));

const viewer = { userId: 'user-1', roles: ['editor'], organizationId: 'org-1' };

const listDeskAssignmentsMock = listDeskAssignments as jest.Mock;
const countsMock = countAssignmentsByStatus as jest.Mock;
const loadEditorRosterMock = loadEditorRoster as jest.Mock;

const getAssignmentMock = getAssignment as jest.Mock;

const renderDashboard = async (params: Record<string, string> = {}) =>
  render(await Dashboard({ searchParams: Promise.resolve(params) }));

const postedAssignment: Assignment = {
  id: 'posted-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Posted to the database',
  description: '',
  category: 'Reporting/Writing',
  slug: 'posted-to-the-database',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '500 words',
  deadline: new Date(2030, 0, 2, 12, 0),
  compensation: '800',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
};

/** The same posted assignment with another status, for the count tests */
const post = (overrides: Partial<Assignment>): Assignment => ({
  ...postedAssignment,
  id: 'posted-2',
  slug: 'posted-2',
  ...overrides,
});

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listDeskAssignmentsMock.mockResolvedValue({ items: [], nextCursor: null });
    countsMock.mockResolvedValue({ open: 0, invited: 0, assigned: 0 });
    getAssignmentMock.mockResolvedValue(null);
    loadEditorRosterMock.mockResolvedValue({
      members: ROSTER.slice(0, 3),
      invitable: ROSTER.slice(3),
    });
  });

  it('counts what the database returned', async () => {
    listDeskAssignmentsMock.mockResolvedValue({
      items: [
        postedAssignment,
        post({ id: 'posted-2', status: 'invited' }),
        post({ id: 'posted-3', status: 'assigned' }),
      ],
      nextCursor: null,
    });
    countsMock.mockResolvedValue({ open: 1, invited: 1, assigned: 1 });

    await renderDashboard();

    const counts = screen.getByRole('list', { name: /assignment counts/i });
    expect(within(counts).getByText('1 open')).toBeInTheDocument();
    expect(within(counts).getByText('1 pending')).toBeInTheDocument();
    expect(within(counts).getByText('1 assigned')).toBeInTheDocument();
  });

  it('offers Load more when the server has another page', async () => {
    listDeskAssignmentsMock.mockResolvedValue({ items: [postedAssignment], nextCursor: 'cursor-1' });
    countsMock.mockResolvedValue({ open: 3, invited: 0, assigned: 0 });

    await renderDashboard();

    expect(screen.getByRole('button', { name: 'Load more' })).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 3')).toBeInTheDocument();
  });

  it('offers one search box that filters both columns', async () => {
    await renderDashboard();

    expect(screen.getByRole('searchbox', { name: /search assignments and roster/i })).toBeInTheDocument();
  });

  it('says nothing is open rather than showing sample work nobody posted', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /assignments/i });

    expect(within(column).queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByText(/election night/i)).not.toBeInTheDocument();
  });

  it('shows every freelancer the editor saved, even before they answer a notification', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /availability/i });
    const saved = ROSTER.slice(0, 3);
    const onToday = saved.filter((m) => m.status !== 'off').length;

    expect(within(column).getByText(`${onToday} of ${saved.length} on roster`)).toBeInTheDocument();
    saved.forEach((m) => {
      expect(within(column).getByRole('heading', { level: 3, name: m.name })).toBeInTheDocument();
    });
    expect(within(column).getByText(saved[0].note)).toBeInTheDocument();

    // the wider directory stays out of the availability column
    ROSTER.slice(3).forEach((m) => {
      expect(within(column).queryByRole('heading', { level: 3, name: m.name })).not.toBeInTheDocument();
    });
  });

  it('says the roster could not be loaded when it fails, rather than pretending it is empty', async () => {
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    loadEditorRosterMock.mockRejectedValue(new Error('db down'));
    await renderDashboard();
    const column = screen.getByRole('region', { name: /availability/i });

    expect(within(column).getByRole('alert')).toHaveTextContent(/couldn't be loaded/i);
    expect(within(column).queryByText(/no one on your roster yet/i)).not.toBeInTheDocument();
    consoleMock.mockRestore();
  });

  it('points at the roster page when the editor has none yet', async () => {
    loadEditorRosterMock.mockResolvedValue({ members: [], invitable: ROSTER });
    await renderDashboard();
    const column = screen.getByRole('region', { name: /availability/i });

    expect(within(column).getByText(/no one on your roster yet/i)).toBeInTheDocument();
    expect(within(column).getByRole('link', { name: /build your roster/i })).toHaveAttribute(
      'href',
      '/dashboard/roster'
    );
    expect(within(column).queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('shows the range and filter toggles with the defaults pressed', async () => {
    await renderDashboard();
    const range = screen.getByRole('group', { name: /availability range/i });
    expect(within(range).getByRole('button', { name: 'day' })).toHaveAttribute('aria-pressed', 'true');
    const filters = screen.getByRole('group', { name: /filter assignments/i });
    expect(within(filters).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(filters).getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('has no assignment drawer open by default', async () => {
    await renderDashboard();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a posted assignment in a drawer that closes back to the desk', async () => {
    getAssignmentMock.mockResolvedValue(postedAssignment);
    await renderDashboard({ assignment: postedAssignment.id });

    const drawer = screen.getByRole('dialog', { name: postedAssignment.title });
    expect(within(drawer).getByRole('heading', { level: 1, name: postedAssignment.title })).toBeInTheDocument();
    // the editor's own organization posted it, so it can be edited from the drawer
    expect(within(drawer).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Close' })).toHaveAttribute('href', '/dashboard');
  });

  it('does not open a drawer for an assignment the editor cannot see', async () => {
    getAssignmentMock.mockResolvedValue({ ...postedAssignment, organizationId: 'org-2', createdByUserId: 'user-9' });
    await renderDashboard({ assignment: postedAssignment.id });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists the posted assignments with their details and a link that opens each one in the drawer', async () => {
    listDeskAssignmentsMock.mockResolvedValue({
      items: [postedAssignment, post({ id: 'posted-9', title: 'Second post' })],
      nextCursor: null,
    });

    await renderDashboard();

    const column = screen.getByRole('region', { name: /assignments/i });
    const cards = within(column).getAllByRole('article');
    expect(cards).toHaveLength(2);

    expect(within(cards[0]).getByRole('heading', { name: /posted to the database/i })).toBeInTheDocument();
    expect(within(cards[0]).getByText(/sam desk/i)).toBeInTheDocument();
    expect(within(cards[0]).getByText('$800')).toBeInTheDocument();
    expect(within(cards[1]).getByRole('heading', { name: 'Second post' })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /posted to the database/i })).toHaveAttribute(
      'href',
      '/dashboard?assignment=posted-1'
    );
  });

  it('keeps the New Assignment drawer closed without ?new=assignment', async () => {
    await renderDashboard();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
