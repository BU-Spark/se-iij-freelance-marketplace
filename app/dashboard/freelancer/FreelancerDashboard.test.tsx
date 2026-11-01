import { fireEvent, render, screen, within } from '@testing-library/react';
import FreelancerDashboard from './FreelancerDashboard';
import { ASSIGNMENTS } from '../constants';
import type { DeskAssignment } from '../../types/dashboard.types';

const tasks: DeskAssignment[] = [
  ...Array.from({ length: 6 }, (_, index) => ({
    ...ASSIGNMENTS[0],
    id: `open-${index}`,
    title: `Opportunity ${index}`,
    invitedIds: [],
    deadline: new Date(2030, 0, index + 1),
  })),
  { ...ASSIGNMENTS[2], id: 'mine-invited', title: 'My invitation', invitedIds: ['me'] },
  { ...ASSIGNMENTS[2], id: 'other-invited', title: 'Other invitation', invitedIds: ['other'] },
  { ...ASSIGNMENTS[3], id: 'mine-active', title: 'My ongoing work', assignedToId: 'me' },
  { ...ASSIGNMENTS[3], id: 'other-active', title: 'Other ongoing work', assignedToId: 'other' },
];
const feed = () => within(screen.getByRole('region', { name: 'Task feed' }));

it('shows only personal in-progress tasks and excludes other private tasks', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  const active = within(screen.getByRole('region', { name: 'In progress' }));
  expect(active.getByRole('heading', { name: 'My ongoing work' })).toBeInTheDocument();
  expect(screen.queryByText('Other ongoing work')).not.toBeInTheDocument();
  expect(screen.queryByText('Other invitation')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'invited' } });
  expect(feed().getAllByRole('article')).toHaveLength(1);
  expect(feed().getByText('My invitation')).toBeInTheDocument();
});

it('paginates and resets to the first page when search or status changes', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  expect(feed().getAllByRole('article')).toHaveLength(4);
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: '  OPPORTUNITY  ' } });
  expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(feed().getAllByRole('article')).toHaveLength(2);
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'in-progress' } });
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('No matching tasks');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByLabelText('Search tasks')).toHaveValue('');
  expect(feed().getAllByRole('article')).toHaveLength(4);
});

it('handles an empty feed with disabled pagination', () => {
  render(<FreelancerDashboard assignments={[]} freelancerId="me" />);
  expect(screen.getByText('No assignments in progress.')).toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('No matching tasks');
  expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
});

it('combines category, location, search, and status without hiding ongoing work', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Reporting/Writing' } });
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Central City Hall' } });
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'open' } });
  fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'Opportunity 0' } });
  expect(feed().getAllByRole('article')).toHaveLength(1);
  expect(feed().getByText('Opportunity 0')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'In progress' })).getByText('My ongoing work')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Remote' } });
  expect(screen.getByRole('status')).toHaveTextContent('No matching tasks');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByLabelText('Category')).toHaveValue('');
  expect(screen.getByLabelText('Location')).toHaveValue('');
  expect(screen.getByLabelText('Status')).toHaveValue('all');
  expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
});
