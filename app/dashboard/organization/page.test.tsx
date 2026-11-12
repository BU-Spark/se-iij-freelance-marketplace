import { render, screen, within } from '@testing-library/react';
import { auth } from '@clerk/nextjs/server';
import OrganizationPage from './page';
import { countAssignmentsByStatus, listDeskAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import { listOrganizationTeam } from '../../../lib/organization';
import type { Assignment } from '../../types/assignments.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/workspace', () => ({ requireWorkspace: jest.fn() }));
jest.mock('../../../lib/assignments', () => ({
  listDeskAssignments: jest.fn(),
  countAssignmentsByStatus: jest.fn(),
  loadAssignmentViewer: jest.fn(),
}));
jest.mock('../../../lib/organization', () => ({ listOrganizationTeam: jest.fn() }));
jest.mock('../assignments/loadAssignmentView', () => ({ loadAssignmentView: jest.fn(async () => null) }));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadAssignmentViewer as jest.Mock;
const listMock = listDeskAssignments as jest.Mock;
const countsMock = countAssignmentsByStatus as jest.Mock;
const teamMock = listOrganizationTeam as jest.Mock;

const post: Assignment = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: 'meridian',
  createdByUserId: 'user-1',
  title: 'City hall budget',
  description: '',
  category: 'Reporting/Writing',
  slug: 'city-hall-budget',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: new Date('2030-01-02T12:00:00Z'),
  compensation: '750',
  status: 'assigned',
  createdAt: new Date('2030-01-01'),
  updatedAt: new Date('2030-01-01'),
};

const renderPage = async () => render(await OrganizationPage({ searchParams: Promise.resolve({}) }));

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: 'meridian' });
  listMock.mockResolvedValue({ items: [post], nextCursor: null });
  countsMock.mockResolvedValue({ open: 2, invited: 1, assigned: 3 });
  teamMock.mockResolvedValue([
    { id: 'user-1', name: 'Joey Lam', jobTitle: 'News editor', location: 'Boston', desks: ['Politics'] },
    { id: 'user-2', name: 'Sam Desk', jobTitle: 'Desk editor', location: null, desks: [] },
  ]);
});

describe('Organization page', () => {
  it('names the organization and shows what it has on the go', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'The Meridian Post' })).toBeInTheDocument();

    const stats = screen.getByRole('list', { name: /organization at a glance/i });
    const cards = within(stats).getAllByRole('listitem');
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent(/2\s*Open/);
    expect(cards[1]).toHaveTextContent(/1\s*Pending/);
    expect(cards[2]).toHaveTextContent(/3\s*Assigned/);
    expect(cards[3]).toHaveTextContent(/2\s*People/);
  });

  it('lists the team with their job titles', async () => {
    await renderPage();

    const team = screen.getByRole('region', { name: /team/i });
    expect(within(team).getByText('Joey Lam')).toBeInTheDocument();
    expect(within(team).getByText('News editor · Boston')).toBeInTheDocument();
    expect(within(team).getByText('Sam Desk')).toBeInTheDocument();
  });

  it('shows every status in the assignment table, not just open ones', async () => {
    await renderPage();

    const assignments = screen.getByRole('region', { name: /assignments/i });
    const table = within(assignments).getByRole('table', { name: 'Assignments' });
    expect(within(table).getByText('City hall budget')).toBeInTheDocument();
    expect(within(table).getByText('Assigned')).toBeInTheDocument();
  });

  it('offers the desk when you have no organization yet', async () => {
    viewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: null });

    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: /no organization yet/i })).toBeInTheDocument();
    expect(screen.getByText(/ask an admin to set your organization/i)).toBeInTheDocument();
    expect(listMock).not.toHaveBeenCalled();
  });
});
