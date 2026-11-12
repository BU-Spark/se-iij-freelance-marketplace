import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/Toast/ToastProvider';
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

const button = (group: string, name: string) =>
  within(screen.getByRole('group', { name: group })).getByRole('button', { name: new RegExp(`^${name}`) });
const view = (name: string) => button('Show', name);
const filter = (name: string) => button('Type', name);
const click = (label: string, action: string) =>
  userEvent.click(
    within(screen.getByRole('group', { name: `Actions for ${label}` })).getByRole('button', { name: action })
  );

const renderInbox = () =>
  render(
    <ToastProvider>
      <AdminInbox reports={reports} />
    </ToastProvider>
  );

describe('AdminInbox', () => {
  it('lists every flag under To do, newest first, with counts', () => {
    renderInbox();

    expect(view('To do')).toHaveAttribute('aria-pressed', 'true');
    expect(view('To do')).toHaveTextContent('To do3');
    expect(view('Done')).toHaveTextContent('Done0');
    expect(filter('All')).toHaveTextContent('All3');
    expect(filter('Accounts')).toHaveTextContent('Accounts2');
    expect(filter('Assignments')).toHaveTextContent('Assignments0');

    const cards = screen.getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(cards[0]).toHaveTextContent('Flagged pitch');
    expect(cards[0]).toHaveTextContent('Reported by Ada Editor');
    expect(cards[0]).toHaveTextContent('Looks like spam');
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

    expect(screen.getByText('Flag marked as in review.')).toBeInTheDocument();
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
    renderInbox();

    await click('City council budget leak', action);

    expect(screen.getByText(message)).toBeInTheDocument();
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
    renderInbox();
    await click('City council budget leak', 'Resolve');
    await userEvent.click(view('Done'));

    await click('City council budget leak', 'Change to dismissed');
    expect(within(screen.getByRole('listitem')).getByText('Dismissed')).toBeInTheDocument();

    await click('City council budget leak', 'Reopen');
    expect(view('Done')).toHaveTextContent('Done0');

    await userEvent.click(view('To do'));
    expect(screen.getByText('City council budget leak')).toBeInTheDocument();
  });
});
