import { render, screen, within } from '@testing-library/react';
import { auth } from '@clerk/nextjs/server';
import OrganizationPage from './page';
import { countAssignmentsByStatus, loadAssignmentViewer } from '../../../lib/assignments';
import { listOrganizationTeam } from '../../../lib/organization';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/workspace', () => ({ requireWorkspace: jest.fn() }));
jest.mock('../../../lib/assignments', () => ({
  countAssignmentsByStatus: jest.fn(),
  loadAssignmentViewer: jest.fn(),
}));
jest.mock('../../../lib/organization', () => ({ listOrganizationTeam: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadAssignmentViewer as jest.Mock;
const countsMock = countAssignmentsByStatus as jest.Mock;
const teamMock = listOrganizationTeam as jest.Mock;

const renderPage = async () => render(await OrganizationPage());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  viewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: 'meridian' });
  countsMock.mockResolvedValue({ open: 2, invited: 1, assigned: 3 });
  teamMock.mockResolvedValue([
    { id: 'user-1', name: 'Joey Lam', jobTitle: 'News editor', location: 'Boston', desks: ['Politics'] },
    { id: 'user-2', name: 'Sam Desk', jobTitle: 'Desk editor', location: null, desks: [] },
  ]);
});

describe('Organization page', () => {
  it('names the organization and counts what it has on the go', async () => {
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

  it('lists the team with their job titles and desks', async () => {
    await renderPage();

    const team = screen.getByRole('region', { name: /team/i });
    expect(within(team).getByText('Joey Lam')).toBeInTheDocument();
    expect(within(team).getByText('News editor · Boston')).toBeInTheDocument();
    expect(within(team).getByText('Politics')).toBeInTheDocument();
    expect(within(team).getByText('Sam Desk')).toBeInTheDocument();
  });

  it('offers the desk when you have no organization yet', async () => {
    viewerMock.mockResolvedValue({ userId: 'user-1', roles: ['editor'], organizationId: null });

    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: /no organization yet/i })).toBeInTheDocument();
    expect(screen.getByText(/ask an admin to set your organization/i)).toBeInTheDocument();
    expect(teamMock).not.toHaveBeenCalled();
  });

  it('says so when the organization cannot be read', async () => {
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    teamMock.mockRejectedValue(new Error('db down'));

    await renderPage();

    // the page still renders, with empty counts rather than a crash
    expect(screen.getByRole('heading', { level: 1, name: 'The Meridian Post' })).toBeInTheDocument();
    expect(screen.getByText(/nobody else is listed/i)).toBeInTheDocument();
    consoleMock.mockRestore();
  });
});
