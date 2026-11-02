import { render, screen } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import { ASSIGNMENTS } from '../../constants';
it('renders freelancer-specific assignment status and compensation', () => {
  render(<TaskCard task={ASSIGNMENTS[3]} freelancerId="priya" />);
  expect(screen.getByText('In progress')).toBeInTheDocument();
  expect(screen.getByText(/transit ridership/i)).toBeInTheDocument();
  expect(screen.getByText(/140/)).toBeInTheDocument();
});
it('identifies an invitation on an open task', () => {
  render(<TaskCard task={ASSIGNMENTS[0]} freelancerId="marcus" />);
  expect(screen.getByText('Invited')).toBeInTheDocument();
  expect(screen.getByText('Urgent')).toBeInTheDocument();
});
