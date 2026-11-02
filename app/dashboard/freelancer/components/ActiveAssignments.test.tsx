import { render, screen } from '@testing-library/react';
import { ActiveAssignments } from './ActiveAssignments';
it('shows an empty state when no active tasks are supplied', () => {
  render(<ActiveAssignments active={[]} freelancerId="priya" />);
  expect(screen.getByText('No assignments in progress.')).toBeInTheDocument();
});
