import { render, screen } from '@testing-library/react';
import AssignmentDetail from './AssignmentDetail';
import type { Assignment } from '../../../types/assignments.types';

const assignment: Assignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Election night',
  description: 'Live coverage from the county clerk.',
  category: 'Reporting/Writing',
  slug: 'election-night-abc123',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words / 4 hours',
  deadline: new Date(2030, 0, 1, 23, 0),
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
};

describe('AssignmentDetail', () => {
  it('shows every detail of the assignment, including the description', () => {
    render(<AssignmentDetail assignment={assignment} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Election night' })).toBeInTheDocument();
    expect(screen.getByText('Live coverage from the county clerk.')).toBeInTheDocument();
    expect(screen.getByText('800 words / 4 hours')).toBeInTheDocument();
    expect(screen.getByText('$750')).toBeInTheDocument();
    expect(screen.getByText('Point of contact: Sam Desk')).toBeInTheDocument();
    expect(screen.getByText('election-night-abc123')).toBeInTheDocument();
  });

  it('shows the updated date once an assignment has been changed', () => {
    render(<AssignmentDetail assignment={{ ...assignment, updatedAt: new Date(2030, 0, 3) }} />);

    expect(screen.getByText(/Updated Jan 3, 2030/)).toBeInTheDocument();
  });

  it('says when there is no description or deadline', () => {
    render(<AssignmentDetail assignment={{ ...assignment, description: '', deadline: null }} />);

    expect(screen.getByText('No description yet.')).toBeInTheDocument();
    expect(screen.getByText('No deadline')).toBeInTheDocument();
  });

  it('links sample assignments back to the dashboard', () => {
    render(<AssignmentDetail assignment={assignment} isSample />);

    expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText(/sample assignment/i)).toBeInTheDocument();
  });
});
