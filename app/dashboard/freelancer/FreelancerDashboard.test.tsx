import { fireEvent, render, screen, within } from '@testing-library/react';
import FreelancerDashboard from './FreelancerDashboard';
import { SAMPLE_ASSIGNMENTS } from '../../../test/fixtures/assignments';
import type { DeskAssignment } from '../../types/dashboard.types';

const tasks: DeskAssignment[] = [
  ...Array.from({ length: 6 }, (_, index) => ({
    ...SAMPLE_ASSIGNMENTS[0],
    id: `open-${index}`,
    title: `Opportunity ${index}`,
    invitedIds: [],
    deadline: new Date(2030, 0, index + 1),
  })),
  { ...SAMPLE_ASSIGNMENTS[2], id: 'mine-invited', title: 'My invitation', invitedIds: ['me'] },
  { ...SAMPLE_ASSIGNMENTS[2], id: 'other-invited', title: 'Other invitation', invitedIds: ['other'] },
  { ...SAMPLE_ASSIGNMENTS[3], id: 'mine-active', title: 'My ongoing work', assignedToId: 'me' },
  { ...SAMPLE_ASSIGNMENTS[3], id: 'other-active', title: 'Other ongoing work', assignedToId: 'other' },
];
const feed = () => within(screen.getByRole('region', { name: 'Task feed' }));
// the All / Open / Invited / In progress toggle in the feed's heading, like the editor desk's
const statusButton = (name: string) =>
  within(screen.getByRole('group', { name: 'Filter assignments' })).getByRole('button', { name });

it('shows only personal in-progress tasks and excludes other private tasks', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  const active = within(screen.getByRole('region', { name: 'In progress' }));
  expect(active.getByRole('heading', { name: 'My ongoing work' })).toBeInTheDocument();
  expect(screen.queryByText('Other ongoing work')).not.toBeInTheDocument();
  expect(screen.queryByText('Other invitation')).not.toBeInTheDocument();
  fireEvent.click(statusButton('Invited'));
  expect(feed().getAllByRole('article')).toHaveLength(1);
  expect(feed().getByText('My invitation')).toBeInTheDocument();
});

it('lists every matching task without paging, and narrows by search and status', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  // 6 open, my invitation and my ongoing work: all on one page
  expect(feed().getAllByRole('article')).toHaveLength(8);
  expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: '  OPPORTUNITY  ' } });
  expect(feed().getAllByRole('article')).toHaveLength(6);
  expect(screen.getByRole('status')).toHaveTextContent('Showing 6 of 8 assignments');
  fireEvent.click(statusButton('In progress'));
  expect(screen.getByRole('status')).toHaveTextContent('No matching tasks');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByLabelText('Search tasks')).toHaveValue('');
  expect(feed().getAllByRole('article')).toHaveLength(8);
});

it('handles an empty feed', () => {
  render(<FreelancerDashboard assignments={[]} freelancerId="me" />);
  expect(screen.getByText('No assignments in progress.')).toBeInTheDocument();
  // an empty feed is not the same as filters hiding everything
  expect(screen.getByRole('status')).toHaveTextContent('No open assignments yet');
});

it('combines category, location, search, and status without hiding ongoing work', () => {
  render(<FreelancerDashboard assignments={tasks} freelancerId="me" />);
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Reporting/Writing' } });
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Central City Hall' } });
  fireEvent.click(statusButton('Open'));
  fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'Opportunity 0' } });
  expect(feed().getAllByRole('article')).toHaveLength(1);
  expect(feed().getByText('Opportunity 0')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'In progress' })).getByText('My ongoing work')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Remote' } });
  expect(screen.getByRole('status')).toHaveTextContent('No matching tasks');
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(screen.getByLabelText('Category')).toHaveValue('');
  expect(screen.getByLabelText('Location')).toHaveValue('');
  expect(statusButton('All')).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Clear filters' })).toBeDisabled();
});
