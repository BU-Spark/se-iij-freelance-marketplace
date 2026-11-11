import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssignmentResponse from './AssignmentResponse';

beforeEach(() => window.localStorage.clear());

const renderResponse = () => render(<AssignmentResponse assignmentId="a1" assignmentTitle="Budget vote" />);

it('records interest and lets the freelancer withdraw it', async () => {
  renderResponse();

  await userEvent.click(screen.getByRole('button', { name: /I'm interested/ }));
  expect(screen.getByText(/you've signaled interest/i)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Withdraw interest' }));
  expect(screen.getByText('Signal interest to be considered.')).toBeInTheDocument();
});

it('declines with a reason and shows why', async () => {
  renderResponse();

  await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
  await userEvent.click(screen.getByLabelText('Needs more detail'));
  await userEvent.click(screen.getByRole('button', { name: 'Send decline' }));

  expect(screen.getByText('You passed on this assignment.')).toBeInTheDocument();
  expect(screen.getByText(/Needs more detail/)).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('sends a proposal and remembers it after a reload', async () => {
  const { unmount } = renderResponse();

  await userEvent.click(screen.getByRole('button', { name: 'Negotiate' }));
  await userEvent.type(screen.getByLabelText('Proposed changes'), 'Push the deadline a week');
  await userEvent.click(screen.getByRole('button', { name: 'Send proposal' }));
  unmount();

  renderResponse();
  expect(await screen.findByText('Your proposed changes are with the editor.')).toBeInTheDocument();
  expect(screen.getByText('Push the deadline a week')).toBeInTheDocument();
});
