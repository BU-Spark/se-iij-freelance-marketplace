import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/Toast/ToastProvider';
import type { Appeal } from '../../lib/appeals';
import AppealList from './AppealList';

const appeal: Appeal = {
  id: 'appeal-1',
  userId: 'user-1',
  name: 'Amara Okafor',
  email: 'amara@example.com',
  message: 'My portfolio was misread — those clips are mine.',
  suspensionReason: 'Copied portfolio',
  status: 'open',
  createdAt: '2026-11-10T09:00:00.000Z',
};

const originalFetch = global.fetch;
const fetchMock = jest.fn();

const renderList = (appeals: Appeal[] = [appeal]) =>
  render(
    <ToastProvider>
      <AppealList appeals={appeals} />
    </ToastProvider>
  );

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('AppealList', () => {
  it('stays out of the way when nobody is appealing', () => {
    renderList([]);

    expect(screen.queryByRole('heading', { name: /appeals waiting/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the appeal next to why the account was suspended', () => {
    renderList();

    expect(screen.getByRole('heading', { name: /appeals waiting/i })).toBeInTheDocument();
    expect(screen.getByText('Amara Okafor')).toBeInTheDocument();
    expect(screen.getByText(/those clips are mine/i)).toBeInTheDocument();
    expect(screen.getByText('Copied portfolio')).toBeInTheDocument();
  });

  it('reactivates the account and closes the appeal', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ account: { id: 'user-1', status: 'active' } }) });
    renderList();

    const group = screen.getByRole('group', { name: 'Appeal from Amara Okafor' });
    await userEvent.click(within(group).getByRole('button', { name: /reactivate account/i }));

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/accounts/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    expect(await screen.findByText('Amara Okafor is active again.')).toBeInTheDocument();
    expect(screen.queryByText(/those clips are mine/i)).not.toBeInTheDocument();
  });

  it('keeps the appeal in the queue when the account cannot be reactivated', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Account not found.' }) });
    renderList();

    const group = screen.getByRole('group', { name: 'Appeal from Amara Okafor' });
    await userEvent.click(within(group).getByRole('button', { name: /reactivate account/i }));

    expect(await screen.findByText('Account not found.')).toBeInTheDocument();
    expect(screen.getByText('Amara Okafor')).toBeInTheDocument();
  });
});
