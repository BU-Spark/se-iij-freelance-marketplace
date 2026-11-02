import { render, screen, within } from '@testing-library/react';
import Dashboard from './page';
import type { Assignment } from '../types/assignments.types';
import { ASSIGNMENTS, ROSTER } from './constants';
import { listOpenAssignments } from '../../lib/assignments';

// EditorHeader has its own tests; swap it for a simple stand-in so these tests only check the dashboard
jest.mock('../components/header/EditorHeader', () => ({
  EditorHeader: () => <header>Header</header>,
}));

// No real browser URL in tests; pretend there's no "?new=assignment"
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../lib/assignments', () => ({ listOpenAssignments: jest.fn() }));

const listOpenAssignmentsMock = listOpenAssignments as jest.Mock;

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

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listOpenAssignmentsMock.mockResolvedValue([]);
  });

  it('renders the shared header and the status bar with real numbers', async () => {
    await renderDashboard();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    const counts = screen.getByRole('list', { name: /assignment counts/i });
    expect(within(counts).getByText('2 open')).toBeInTheDocument();
    expect(within(counts).getByText('1 pending')).toBeInTheDocument();
    expect(within(counts).getByText('1 assigned')).toBeInTheDocument();
  });

  it('lists every roster member with the roster count', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /availability/i });
    expect(within(column).getByText(`5 of ${ROSTER.length} on roster`)).toBeInTheDocument();
    ROSTER.forEach((m) => {
      expect(within(column).getByRole('heading', { level: 3, name: m.name })).toBeInTheDocument();
    });
    expect(within(column).getByText(ROSTER[0].note)).toBeInTheDocument();
  });

  it('shows the range and filter toggles with the defaults pressed', async () => {
    await renderDashboard();
    const range = screen.getByRole('group', { name: /availability range/i });
    expect(within(range).getByRole('button', { name: 'day' })).toHaveAttribute('aria-pressed', 'true');
    const filters = screen.getByRole('group', { name: /filter assignments/i });
    expect(within(filters).getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(filters).getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('lists every assignment with its details', async () => {
    await renderDashboard();
    const column = screen.getByRole('region', { name: /assignments/i });
    expect(within(column).getAllByRole('article')).toHaveLength(ASSIGNMENTS.length);

    const card = within(column)
      .getByRole('heading', { name: /election night/i })
      .closest('article')!;
    expect(within(card).getByText(/sarah jenkins, news desk/i)).toBeInTheDocument();
    expect(within(card).getByText(/\$1\.10 \/ word \(≈ \$1,100 est\.\)/)).toBeInTheDocument();
    expect(within(card).getByText('3 interested')).toBeInTheDocument();
  });

  it('shows assignments posted to the database above the sample data', async () => {
    listOpenAssignmentsMock.mockResolvedValue([postedAssignment]);

    await renderDashboard();

    const column = screen.getByRole('region', { name: /assignments/i });
    const cards = within(column).getAllByRole('article');
    expect(cards).toHaveLength(ASSIGNMENTS.length + 1);
    expect(within(cards[0]).getByRole('heading', { name: /posted to the database/i })).toBeInTheDocument();
    expect(within(cards[1]).getByRole('heading', { name: ASSIGNMENTS[0].title })).toBeInTheDocument();
    expect(within(cards[0]).getByText('$800')).toBeInTheDocument();

    const counts = screen.getByRole('list', { name: /assignment counts/i });
    expect(within(counts).getByText('3 open')).toBeInTheDocument();
  });

  it('keeps the New Assignment drawer closed without ?new=assignment', async () => {
    await renderDashboard();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
