import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskResponse } from './TaskResponse';

const ok = async () => ({ ok: true as const });
const at = '2026-11-27T00:00:00Z';

it('takes interest back when "Interested ✓" is clicked again', async () => {
  const withdraw = jest.fn(ok);
  render(
    <TaskResponse title="Budget vote" response={{ kind: 'interested', at }} respond={jest.fn(ok)} withdraw={withdraw} />
  );
  expect(screen.getByText("You've signaled interest. The editor will follow up.")).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Interested ✓' }));
  expect(withdraw).toHaveBeenCalled();
});

it('sends a decline with the reasons chosen in the dialog', async () => {
  const respond = jest.fn(ok);
  render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
  await userEvent.click(screen.getByLabelText('Outside my beat'));
  await userEvent.click(screen.getByRole('button', { name: 'Send decline' }));
  expect(respond).toHaveBeenCalledWith({ kind: 'declined', reasons: ['Outside my beat'], note: '' });
  expect(screen.queryByRole('button', { name: 'Send decline' })).not.toBeInTheDocument();
});

it('shows why the freelancer passed', () => {
  render(
    <TaskResponse
      title="Budget vote"
      response={{ kind: 'declined', reasons: ["Timing doesn't work"], note: 'Booked until May', at }}
      respond={jest.fn(ok)}
      withdraw={jest.fn(ok)}
    />
  );
  expect(screen.getByText('You passed on this assignment.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Declined' })).toBeInTheDocument();
  expect(screen.getByText('Why you passed')).toBeInTheDocument();
  expect(screen.getByText("Timing doesn't work")).toBeInTheDocument();
  expect(screen.getByText('Booked until May')).toBeInTheDocument();
});

it('sends a proposal and shows it as sent', async () => {
  const respond = jest.fn(ok);
  const { rerender } = render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  await userEvent.click(screen.getByRole('button', { name: 'Negotiate' }));
  await userEvent.type(screen.getByLabelText('Proposed changes'), '$900');
  await userEvent.click(screen.getByRole('button', { name: 'Send proposal' }));
  expect(respond).toHaveBeenCalledWith({ kind: 'negotiating', proposal: '$900' });

  rerender(
    <TaskResponse
      title="Budget vote"
      response={{ kind: 'negotiating', proposal: '$900', at }}
      respond={respond}
      withdraw={jest.fn(ok)}
    />
  );
  expect(screen.getByRole('button', { name: 'Negotiating…' })).toBeInTheDocument();
  expect(screen.getByText('Proposed changes sent')).toBeInTheDocument();
  expect(screen.getByText('$900')).toBeInTheDocument();
});

it('signals interest and shows the error when saving fails', async () => {
  const respond = jest.fn(async () => ({ ok: false as const, error: 'Unable to save your answer right now.' }));
  render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  expect(screen.getByText('Signal interest to be considered.')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: "I'm interested" }));
  expect(respond).toHaveBeenCalledWith({ kind: 'interested' });
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save your answer right now.');
});
