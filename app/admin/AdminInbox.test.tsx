import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/Toast/ToastProvider';
import type { Appeal } from '../../lib/appeals';
import type { FlagReport } from '../types/admin.types';
import AdminInbox from './AdminInbox';

const report: FlagReport = {
  id: 'f1',
  targetType: 'pitch',
  targetId: 'p1',
  targetLabel: 'City council budget leak',
  reason: 'Looks like spam',
  reporterName: 'Ada Editor',
  status: 'open',
  createdAt: '2026-11-01T12:00:00Z',
};

const reports: FlagReport[] = [
  report,
  { ...report, id: 'f2', targetType: 'account', targetLabel: 'Jordan Lee', status: 'reviewing' },
  { ...report, id: 'f3', targetType: 'account', targetLabel: 'Sam Rivera' },
];

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

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

const button = (group: string, name: string) =>
  within(screen.getByRole('group', { name: group })).getByRole('button', { name: new RegExp(`^${name}`) });
const view = (name: string) => button('Show', name);
const filter = (name: string) => button('Type', name);
const click = async (label: string, action: string) => {
  const target = button(`Actions for ${label}`, action);
  // a second decision waits for the previous request to finish and re-enable the buttons
  await waitFor(() => expect(target).toBeEnabled());
  await userEvent.click(target);
};

const renderInbox = (appeals: Appeal[] = [appeal]) =>
  render(
    <ToastProvider>
      <AdminInbox appeals={appeals} reports={reports} />
    </ToastProvider>
  );

describe('AdminInbox', () => {
  it('lists appeals and flags together under To do, newest first, with counts', () => {
    renderInbox();

    expect(view('To do')).toHaveAttribute('aria-pressed', 'true');
    expect(view('To do')).toHaveTextContent('To do4');
    expect(view('Done')).toHaveTextContent('Done0');
    expect(filter('All')).toHaveTextContent('All4');
    expect(filter('Appeals')).toHaveTextContent('Appeals1');
    expect(filter('Accounts')).toHaveTextContent('Accounts2');
    expect(filter('Assignments')).toHaveTextContent('Assignments0');

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(4);
    expect(cards[0]).toHaveTextContent('Amara Okafor');
    expect(cards[0]).toHaveTextContent('Copied portfolio');
    expect(cards[1]).toHaveTextContent('Flagged pitch');
    expect(cards[1]).toHaveTextContent('Reported by Ada Editor');
    expect(cards[1]).toHaveTextContent('Looks like spam');
  });

  it('every card has its actions on it, without opening anything', () => {
    renderInbox();

    expect(screen.getByRole('group', { name: 'Appeal from Amara Okafor' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Actions for City council budget leak' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Actions for Sam Rivera' })).toBeInTheDocument();
  });

  it('filters by type, and shows an empty state when there is none', async () => {
    renderInbox();

    await userEvent.click(filter('Accounts'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(within(screen.getAllByRole('listitem')[0]).getByText('In review')).toBeInTheDocument();

    await userEvent.click(filter('Assignments'));
    expect(screen.getByText('All caught up')).toBeInTheDocument();
  });

  it('marks a new flag as in review', async () => {
    renderInbox();

    await click('City council budget leak', 'Mark in review');

    expect(await screen.findByText('Flag marked as in review.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Actions for City council budget leak' })).queryByRole('button', {
        name: 'Mark in review',
      })
    ).not.toBeInTheDocument();
  });

  it.each([
    ['Resolve', 'Resolved', 'Flag resolved. You can still change it under Done.'],
    ['Dismiss', 'Dismissed', 'Flag dismissed. You can still change it under Done.'],
  ])('%s moves the flag to Done instead of deleting it', async (action, status, message) => {
    renderInbox([]);

    await click('City council budget leak', action);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('City council budget leak')).not.toBeInTheDocument();
    expect(view('Done')).toHaveTextContent('Done1');

    await userEvent.click(view('Done'));
    expect(within(screen.getByRole('listitem')).getByText(status)).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Actions for City council budget leak' })).getByRole('button', {
        name: 'Reopen',
      })
    ).toBeInTheDocument();
  });

  it('lets a done decision be changed or reopened', async () => {
    renderInbox([]);
    await click('City council budget leak', 'Resolve');
    await screen.findByText('Flag resolved. You can still change it under Done.');
    await userEvent.click(view('Done'));

    await click('City council budget leak', 'Change to dismissed');
    await screen.findByText('Flag dismissed. You can still change it under Done.');
    expect(within(screen.getByRole('listitem')).getByText('Dismissed')).toBeInTheDocument();

    await click('City council budget leak', 'Reopen');
    await screen.findByText('Flag marked as in review.');
    expect(view('Done')).toHaveTextContent('Done0');

    await userEvent.click(view('To do'));
    expect(screen.getByText('City council budget leak')).toBeInTheDocument();
  });

  it('leaves the flag where it was when the status cannot be saved', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Only the Story Match team can change flags.' }),
    });
    renderInbox([]);

    await click('City council budget leak', 'Resolve');

    expect(await screen.findByText('Only the Story Match team can change flags.')).toBeInTheDocument();
    expect(screen.getByText('City council budget leak')).toBeInTheDocument();
    expect(view('Done')).toHaveTextContent('Done0');
  });

  it('reactivates the account from an appeal and takes it off the list', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    renderInbox();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Appeal from Amara Okafor' })).getByRole('button', {
        name: /reactivate account/i,
      })
    );

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/accounts/user-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    });
    expect(await screen.findByText('Amara Okafor is active again.')).toBeInTheDocument();
    expect(screen.queryByText(/those clips are mine/i)).not.toBeInTheDocument();
  });

  it('keeps the appeal and shows the error when reactivating fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Account not found.' }) });
    renderInbox();

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Appeal from Amara Okafor' })).getByRole('button', {
        name: /reactivate account/i,
      })
    );

    expect(await screen.findByText('Account not found.')).toBeInTheDocument();
    expect(screen.getByText('Amara Okafor')).toBeInTheDocument();
  });
});
