import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { AccountStatus, AdminAccount } from '../../types/admin.types';
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

const originalFetch = global.fetch;
const fetchMock = jest.fn();

/** Answer the admin API the way the real route does, echoing the requested status back */
const answerWithStatus = () =>
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const account = accounts.find((a) => url === `/api/admin/accounts/${a.id}`)!;
    const { status, reason } = JSON.parse(String(init?.body)) as { status: AccountStatus; reason?: string };

    return {
      ok: true,
      json: async () => ({
        account: { ...account, status, suspensionReason: status === 'suspended' ? reason : undefined },
      }),
    } as unknown as Response;
  });

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

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
    answerWithStatus();
    renderList();
    const actions = screen.getByRole('group', { name: 'Actions for Amara Okafor' });

    await userEvent.click(within(actions).getByRole('button', { name: 'Suspend' }));
    expect(screen.getByRole('button', { name: 'Suspend account' })).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Why are you suspending Amara Okafor?'), 'Spam pitches');
    await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));

    expect(await screen.findByText(/Amara Okafor is suspended/)).toBeInTheDocument();
    expect(within(filter('Suspended')).getByText('2')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/accounts/a1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'suspended', reason: 'Spam pitches' }),
    });

    await userEvent.click(filter('Suspended'));
    expect(screen.getByText('Spam pitches')).toBeInTheDocument();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Actions for Amara Okafor' })).getByRole('button', {
        name: 'Reactivate',
      })
    );
    expect(await screen.findByText('Amara Okafor is active again.')).toBeInTheDocument();
    expect(within(filter('Active')).getByText('2')).toBeInTheDocument();
  });

  it('keeps the account active and shows why when the server refuses', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'You cannot suspend your own account.' }),
    } as unknown as Response);
    renderList();

    const actions = screen.getByRole('group', { name: 'Actions for Amara Okafor' });
    await userEvent.click(within(actions).getByRole('button', { name: 'Suspend' }));
    await userEvent.type(screen.getByLabelText('Why are you suspending Amara Okafor?'), 'Testing');
    await userEvent.click(screen.getByRole('button', { name: 'Suspend account' }));

    expect(await screen.findByText('You cannot suspend your own account.')).toBeInTheDocument();
    expect(within(filter('Active')).getByText('2')).toBeInTheDocument();
    expect(within(filter('Suspended')).getByText('1')).toBeInTheDocument();
  });
});
