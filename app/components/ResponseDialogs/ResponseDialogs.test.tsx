import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeclineDialog, NegotiateDialog } from './ResponseDialogs';

describe('DeclineDialog', () => {
  it('asks for a reason before sending', async () => {
    const onSend = jest.fn();
    render(<DeclineDialog assignmentTitle="Budget vote" onSend={onSend} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send decline' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/at least one reason/i);
  });

  it('sends the chosen reasons and trimmed feedback', async () => {
    const onSend = jest.fn();
    render(<DeclineDialog assignmentTitle="Budget vote" onSend={onSend} onClose={jest.fn()} />);

    await userEvent.click(screen.getByLabelText("Timing doesn't work"));
    await userEvent.type(screen.getByLabelText(/specific feedback/i), '  Booked until May  ');
    await userEvent.click(screen.getByRole('button', { name: 'Send decline' }));

    expect(onSend).toHaveBeenCalledWith(["Timing doesn't work"], 'Booked until May');
  });
});

describe('NegotiateDialog', () => {
  it('needs a proposal before sending', async () => {
    const onSend = jest.fn();
    render(<NegotiateDialog assignmentTitle="Budget vote" onSend={onSend} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send proposal' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('sends the proposed changes', async () => {
    const onSend = jest.fn();
    render(<NegotiateDialog assignmentTitle="Budget vote" onSend={onSend} onClose={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Proposed changes'), 'Deadline pushed one week');
    await userEvent.click(screen.getByRole('button', { name: 'Send proposal' }));

    expect(onSend).toHaveBeenCalledWith('Deadline pushed one week');
  });

  it('closes on cancel', async () => {
    const onClose = jest.fn();
    render(<NegotiateDialog assignmentTitle="Budget vote" onSend={jest.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });
});
