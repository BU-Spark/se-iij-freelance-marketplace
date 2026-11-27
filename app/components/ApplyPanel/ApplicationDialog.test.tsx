import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplicationDialog from './ApplicationDialog';
import { emptyDraft } from './application.utils';
import type { Assignment } from '../../types/assignments.types';

const assignment: Assignment = {
  id: 'assignment-1',
  organizationId: 'org-1',
  createdByUserId: 'user-1',
  title: 'Election night',
  description: 'Live coverage.',
  category: 'Reporting/Writing',
  slug: 'election-night',
  contact: 'Sam Desk',
  location: 'Remote',
  length: '800 words',
  deadline: new Date(2030, 0, 4),
  compensation: '750',
  status: 'open',
  createdAt: new Date(2030, 0, 1),
  updatedAt: new Date(2030, 0, 1),
};

const onSend = jest.fn();

// the dialog is controlled, so the test holds the draft the way its parent does
function Harness() {
  const [draft, setDraft] = useState(emptyDraft());
  return (
    <ApplicationDialog
      assignment={assignment}
      draft={draft}
      editing={false}
      onChange={setDraft}
      onSend={onSend}
      onClose={jest.fn()}
    />
  );
}

describe('ApplicationDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for the missing answers before sending', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Send application' }));

    expect(screen.getByText('Tell the editor why you are a good fit.')).toBeInTheDocument();
    expect(screen.getByText('Add at least one link to your work.')).toBeInTheDocument();
    expect(screen.getByText('Confirm you can meet the deadline.')).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends a complete application with a proposed rate', async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Why are you a good fit?'), 'I covered the last two elections.');
    await userEvent.type(screen.getByLabelText('Work sample 1'), 'example.com/story');
    await userEvent.click(screen.getByLabelText('Propose a different rate'));
    await userEvent.type(screen.getByLabelText('Your rate'), '$900');
    await userEvent.click(screen.getByLabelText(/I can deliver by/));
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }));

    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('allows up to three work samples', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: '+ Add another link' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Add another link' }));

    expect(screen.getByLabelText('Work sample 3')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ Add another link' })).not.toBeInTheDocument();
  });
});
