import { render, screen } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import { SAMPLE_ASSIGNMENTS } from '../../../../test/fixtures/assignments';
import type { DeskAssignment } from '../../../types/dashboard.types';
it('renders freelancer-specific assignment status and compensation', () => {
  render(<TaskCard task={SAMPLE_ASSIGNMENTS[3]} freelancerId="priya" />);
  expect(screen.getByText('In progress')).toBeInTheDocument();
  expect(screen.getByText(/transit ridership/i)).toBeInTheDocument();
  expect(screen.getByText(/140/)).toBeInTheDocument();
});
it('identifies an invitation on an open task', () => {
  render(<TaskCard task={SAMPLE_ASSIGNMENTS[0]} freelancerId="marcus" />);
  expect(screen.getByText('Invited')).toBeInTheDocument();
  expect(screen.getByText('Urgent')).toBeInTheDocument();
});

/** A task as posted from the database: free-text pay, no structured rate and no deadline */
const databaseTask: DeskAssignment = {
  id: 'db-task',
  title: 'City hall budget vote',
  category: 'Reporting',
  status: 'open',
  contact: { name: 'Sam Desk' },
  deadline: null,
  location: 'Remote',
  length: '800 words',
  compensation: '750',
  interestedIds: [],
};

it('falls back to the raw compensation when there is no structured rate', () => {
  render(<TaskCard task={databaseTask} freelancerId="priya" />);
  expect(screen.getByText('$750')).toBeInTheDocument();
});

it('shows a dash instead of a date when the deadline is missing', () => {
  render(<TaskCard task={databaseTask} freelancerId="priya" />);
  expect(screen.getByText('—')).toBeInTheDocument();
});
