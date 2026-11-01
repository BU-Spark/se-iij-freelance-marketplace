import { render, screen, within } from '@testing-library/react';
import FreelancerDashboard from './FreelancerDashboard';
import { ASSIGNMENTS } from '../constants';
it('shows only the selected freelancer’s ongoing work', () => {
  render(<FreelancerDashboard assignments={ASSIGNMENTS} freelancerId="priya" />);
  const active = within(screen.getByRole('region', { name: 'In progress' }));
  expect(active.getByRole('heading', { name: /transit ridership/i })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /harbor night market/i })).not.toBeInTheDocument();
});
it('handles no available work', () => {
  render(<FreelancerDashboard assignments={[]} freelancerId="priya" />);
  expect(screen.getByText('No assignments in progress.')).toBeInTheDocument();
  expect(screen.getByText('No tasks available.')).toBeInTheDocument();
});
