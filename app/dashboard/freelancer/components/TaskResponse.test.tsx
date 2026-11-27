import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskResponse } from './TaskResponse';

const ok = async () => ({ ok: true as const });

it('marks interest straight away', async () => {
  const respond = jest.fn(ok);
  render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  await userEvent.click(screen.getByRole('button', { name: "I'm interested" }));
  expect(respond).toHaveBeenCalledWith({ kind: 'interested' });
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

it('sends a proposal from the negotiate dialog', async () => {
  const respond = jest.fn(ok);
  render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  await userEvent.click(screen.getByRole('button', { name: 'Negotiate' }));
  await userEvent.type(screen.getByLabelText('Proposed changes'), '$900');
  await userEvent.click(screen.getByRole('button', { name: 'Send proposal' }));
  expect(respond).toHaveBeenCalledWith({ kind: 'negotiating', proposal: '$900' });
});

it('shows an existing answer and lets the freelancer take it back', async () => {
  const withdraw = jest.fn(ok);
  render(
    <TaskResponse
      title="Budget vote"
      response={{ kind: 'negotiating', proposal: '$900', at: '2026-11-27T00:00:00Z' }}
      respond={jest.fn(ok)}
      withdraw={withdraw}
    />
  );
  expect(screen.getByRole('status')).toHaveTextContent('You proposed changes: $900');
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(withdraw).toHaveBeenCalled();
});

it("shows the server's error when saving fails", async () => {
  const respond = jest.fn(async () => ({ ok: false as const, error: 'Unable to save your answer right now.' }));
  render(<TaskResponse title="Budget vote" respond={respond} withdraw={jest.fn(ok)} />);
  await userEvent.click(screen.getByRole('button', { name: "I'm interested" }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to save your answer right now.');
});
