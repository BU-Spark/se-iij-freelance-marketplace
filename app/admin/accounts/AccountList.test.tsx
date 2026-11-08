import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { AdminAccount } from '../../types/admin.types';
import AccountList from './AccountList';

const account: AdminAccount = {
  id: 'a1',
  name: 'Amara Okafor',
  email: 'amara@example.com',
  role: 'freelancer',
  status: 'active',
  joinedAt: '2026-09-14T10:00:00Z',
};

const accounts: AdminAccount[] = [
  account,
  { ...account, id: 'a2', name: 'Tomás Reyes', email: 'tomas@example.com', role: 'editor' },
  { ...account, id: 'a3', name: 'Jordan Lee', status: 'suspended', suspensionReason: 'Copied portfolio' },
];

const filter = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

const renderList = () =>
  render(
    <ToastProvider>
      <AccountList accounts={accounts} />
    </ToastProvider>
  );

describe('AccountList', () => {
  it('opens on active accounts with a count per status', () => {
    renderList();

    expect(filter('Active')).toHaveAttribute('aria-pressed', 'true');
    expect(within(filter('Active')).getByText('2')).toBeInTheDocument();
    expect(within(filter('Suspended')).getByText('1')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Freelancer · amara@example.com');
  });

  it('finds people by name or email', async () => {
    renderList();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search accounts' }), 'TOMAS@');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Tomás Reyes')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox'), 'nobody');
    expect(screen.getByText('Try a different name or email.')).toBeInTheDocument();
  });

  it('needs a reason to suspend, then can reactivate', async () => {
    renderList();
    const actions = screen.getByRole('group', { name: 'Actions for Amara Okafor' });

    await userEvent.click(within(actions).getByRole('button', { name: 'Suspend' }));
    expect(screen.getByRole('button', { name: 'Suspend account' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Why are you suspending Amara Okafor?'), 'Spam pitches');
    await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));

    expect(screen.getByText(/Amara Okafor is suspended/)).toBeInTheDocument();
    expect(within(filter('Suspended')).getByText('2')).toBeInTheDocument();

    await userEvent.click(filter('Suspended'));
    expect(screen.getByText('Spam pitches')).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Actions for Amara Okafor' })).getByRole('button', {
        name: 'Reactivate',
      })
    );
    expect(screen.getByText('Amara Okafor is active again.')).toBeInTheDocument();
    expect(within(filter('Active')).getByText('2')).toBeInTheDocument();
  });
});
