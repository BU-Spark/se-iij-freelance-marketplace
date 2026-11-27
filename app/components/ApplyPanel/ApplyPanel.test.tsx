import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ApplyPanel from './ApplyPanel';
import type { Assignment } from '../../types/assignments.types';

const assignment = (id: string): Assignment => ({
  id,
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
});

const fillIn = async () => {
  await userEvent.type(screen.getByLabelText('Why are you a good fit?'), 'I covered the last two elections.');
  await userEvent.type(screen.getByLabelText('Work sample 1'), 'example.com/story');
  await userEvent.click(screen.getByLabelText(/I can deliver by/));
};

describe('ApplyPanel', () => {
  it('keeps a draft after the form is closed', async () => {
    render(<ApplyPanel assignment={assignment('draft')} />);

    await userEvent.click(screen.getByRole('button', { name: 'Apply: Election night' }));
    await userEvent.type(screen.getByLabelText('Why are you a good fit?'), 'Half written');
    await userEvent.click(screen.getByRole('button', { name: 'Close popup' }));
    await userEvent.click(screen.getByRole('button', { name: 'Continue application: Election night' }));

    expect(screen.getByLabelText('Why are you a good fit?')).toHaveValue('Half written');
  });

  it('sends, then withdraws only after confirming', async () => {
    render(<ApplyPanel assignment={assignment('send')} />);

    await userEvent.click(screen.getByRole('button', { name: 'Apply: Election night' }));
    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Applied');

    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    await userEvent.click(screen.getByRole('button', { name: 'Yes, withdraw' }));
    expect(screen.getByRole('button', { name: 'Continue application: Election night' })).toBeInTheDocument();
  });

  it('reuses the last work samples on the next application', async () => {
    const first = render(<ApplyPanel assignment={assignment('first')} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply: Election night' }));
    await userEvent.clear(screen.getByLabelText('Work sample 1'));
    await fillIn();
    await userEvent.click(screen.getByRole('button', { name: 'Send application' }));
    first.unmount();

    render(<ApplyPanel assignment={assignment('second')} />);
    await userEvent.click(screen.getByRole('button', { name: 'Apply: Election night' }));
    expect(screen.getByLabelText('Work sample 1')).toHaveValue('example.com/story');
  });
});
