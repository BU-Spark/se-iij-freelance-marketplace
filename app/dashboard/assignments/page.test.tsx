import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import AssignmentsPage from './page';
import type { Assignment } from '../../types/assignments.types';
import { listOpenAssignments } from '../../../lib/assignments';

jest.mock('../../components/FreelancerWorkspace', () => ({
  FreelancerWorkspace: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
jest.mock('../../../lib/assignments', () => ({ listOpenAssignments: jest.fn() }));

const listOpenAssignmentsMock = listOpenAssignments as jest.Mock;

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
  });

  it('lists the open assignments stored in the database', async () => {
    listOpenAssignmentsMock.mockResolvedValue([
      assignment(),
      assignment({ id: 'assignment-2', title: 'Port authority op-ed', category: 'Editing' }),
    ]);

    render(await AssignmentsPage());

    expect(listOpenAssignmentsMock).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: /election night/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /port authority/i })).toBeInTheDocument();
  });

  it('says so when there are no open assignments yet', async () => {
    listOpenAssignmentsMock.mockResolvedValue([]);

    render(await AssignmentsPage());

    expect(screen.getByRole('status')).toHaveTextContent('No open assignments yet');
  });

  it('tells the reader when the database cannot be reached', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    listOpenAssignmentsMock.mockRejectedValue(new Error('database unavailable'));

    render(await AssignmentsPage());

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load assignments/i);
  });
});
