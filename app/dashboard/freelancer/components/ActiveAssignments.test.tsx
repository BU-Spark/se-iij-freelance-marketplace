import { render, screen } from '@testing-library/react';
import { ActiveAssignments } from './ActiveAssignments';
import type { DeskAssignment } from '../../../types/dashboard.types';
it('shows an empty state when no active tasks are supplied', () => {
  render(<ActiveAssignments active={[]} freelancerId="priya" />);
  expect(screen.getByText('No assignments in progress.')).toBeInTheDocument();
});

const task = (id: string, deadline: Date | null): DeskAssignment => ({
  id,
  title: `Story ${id}`,
  category: 'Reporting',
  status: 'assigned',
  assignedToId: 'priya',
  contact: { name: 'Sam Desk' },
  deadline,
  location: 'Remote',
  length: '800 words',
  compensation: '750',
  interestedIds: [],
});

it('flags assigned work by how close its deadline is', () => {
  const hours = (n: number) => new Date(Date.now() + n * 60 * 60 * 1000);
  render(
    <ActiveAssignments
      active={[task('late', hours(-2)), task('soon', hours(48)), task('later', hours(24 * 10)), task('open', null)]}
      freelancerId="priya"
    />
  );

  expect(screen.getByText('Overdue').closest('li')).toHaveTextContent('Story late');
  expect(screen.getByText('Due soon').closest('li')).toHaveTextContent('Story soon');
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(screen.queryAllByText(/^(Overdue|Due today|Due soon)$/)).toHaveLength(2);
});
