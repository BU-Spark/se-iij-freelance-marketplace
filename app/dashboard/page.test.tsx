import { render, screen, within } from '@testing-library/react';
import Dashboard from './page';
import type { Assignment } from '../types/assignments.types';
import { ROSTER } from './constants';
import { listOpenAssignments } from '../../lib/assignments';
import { loadEditorRoster } from '../../lib/roster';

// EditorHeader has its own tests; swap it for a simple stand-in so these tests only check the dashboard
jest.mock('../components/header/EditorHeader', () => ({
  EditorHeader: () => <header>Header</header>,
}));

// No real browser URL in tests; pretend there's no "?new=assignment"
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(async () => ({ userId: 'clerk-1' })) }));
jest.mock('../../lib/workspace', () => ({ requireWorkspace: jest.fn() }));
jest.mock('../../lib/assignments', () => ({
  listOpenAssignments: jest.fn(),
  loadAssignmentViewer: jest.fn(async () => viewer),
}));
jest.mock('../../lib/roster', () => ({ loadEditorRoster: jest.fn() }));

const viewer = { userId: 'user-1', roles: ['editor'], organizationId: 'org-1' };

const listOpenAssignmentsMock = listOpenAssignments as jest.Mock;
const loadEditorRosterMock = loadEditorRoster as jest.Mock;

const renderDashboard = async () => render(await Dashboard());

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
    listOpenAssignmentsMock.mockResolvedValue([]);
    loadEditorRosterMock.mockResolvedValue({
      members: ROSTER.slice(0, 2),
      pending: [ROSTER[2]],
      invitable: ROSTER.slice(3),
    });
  });

  it('renders the shared header and counts what the database returned', async () => {
    listOpenAssignmentsMock.mockResolvedValue([
      postedAssignment,
      post({ id: 'posted-2', status: 'invited', title: 'Waiting on someone' }),
      post({ id: 'posted-3', status: 'assigned', title: 'Already taken' }),
    ]);

    await renderDashboard();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    const counts = screen.getByRole('list', { name: /assignment counts/i });
    expect(within(counts).getByText('1 open')).toBeInTheDocument();
    expect(within(counts).getByText('1 pending')).toBeInTheDocument();
    expect(within(counts).getByText('1 assigned')).toBeInTheDocument();
  });

  it('says nothing is open rather than showing sample work nobody posted', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /assignments/i });

    expect(within(column).queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByText(/election night/i)).not.toBeInTheDocument();
  });

  it('shows only the freelancers who accepted a place on the editor roster', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /availability/i });
    const accepted = ROSTER.slice(0, 2);
    const onToday = accepted.filter((m) => m.status !== 'off').length;

    expect(within(column).getByText(`${onToday} of ${accepted.length} on roster`)).toBeInTheDocument();
    accepted.forEach((m) => {
      expect(within(column).getByRole('heading', { level: 3, name: m.name })).toBeInTheDocument();
    });
    expect(within(column).getByText(accepted[0].note)).toBeInTheDocument();

    // a pending invite and the wider directory stay out of the availability column
    ROSTER.slice(2).forEach((m) => {
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
    loadEditorRosterMock.mockResolvedValue({ members: [], pending: [ROSTER[0]], invitable: ROSTER.slice(1) });
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

  it('lists the posted assignments with their details and a link to each one', async () => {
    listOpenAssignmentsMock.mockResolvedValue([postedAssignment, post({ id: 'posted-9', title: 'Second post' })]);

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
      '/dashboard/assignments/posted-1'
    );
  });

  it('keeps the New Assignment drawer closed without ?new=assignment', async () => {
    await renderDashboard();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
