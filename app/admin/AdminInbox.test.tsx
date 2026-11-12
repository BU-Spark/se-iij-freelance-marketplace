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

const tab = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });
const actionsFor = (label: string) => screen.getByRole('group', { name: `Actions for ${label}` });
const click = (label: string, action: string) =>
  userEvent.click(within(actionsFor(label)).getByRole('button', { name: action }));

const renderInbox = () =>
  render(
    <ToastProvider>
      <AdminInbox reports={reports} />
    </ToastProvider>
  );

describe('AdminInbox', () => {
  it('opens on flagged pitches that need review, with counts', () => {
    renderInbox();

    expect(tab('Pitches')).toHaveAttribute('aria-pressed', 'true');
    expect(tab('Needs review')).toHaveAttribute('aria-pressed', 'true');
    expect(within(tab('Accounts')).getByText('2')).toBeInTheDocument();
    expect(within(tab('Assignments')).getByText('0')).toBeInTheDocument();
    expect(tab('Needs review')).toHaveTextContent('Needs review (3)');
    expect(tab('Closed')).toHaveTextContent('Closed (0)');

    const [row] = screen.getAllByRole('listitem');
    expect(row).toHaveTextContent('City council budget leak');
    expect(row).toHaveTextContent('Looks like spam');
    expect(row).toHaveTextContent('Reported by Ada Editor');
    expect(row).toHaveTextContent('Flagged pitch');
    // every card carries its own buttons
    expect(within(actionsFor('City council budget leak')).getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('switches type, and shows an empty state when there is none', async () => {
    renderInbox();

    await userEvent.click(tab('Accounts'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('In review')).toBeInTheDocument();

    await userEvent.click(tab('Assignments'));
    expect(screen.getByText('All clear')).toBeInTheDocument();
  });

  it('marks a new flag as in review', async () => {
    renderInbox();

    await click('City council budget leak', 'Mark in review');

    expect(screen.getByText('Flag marked as in review.')).toBeInTheDocument();
    expect(within(screen.getByRole('listitem')).getByText('In review')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark in review' })).not.toBeInTheDocument();
  });

  it.each([
    ['Resolve', 'Resolved', 'Flag resolved. You can still change it under Closed.'],
    ['Dismiss', 'Dismissed', 'Flag dismissed. You can still change it under Closed.'],
  ])('%s moves the flag to Closed instead of deleting it', async (action, status, message) => {
    renderInbox();

    await click('City council budget leak', action);

    expect(screen.getByText(message)).toBeInTheDocument();
    // gone from the queue...
    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(tab('Closed')).toHaveTextContent('Closed (1)');

    // ...but still there under Closed, ready to be reopened
    await userEvent.click(tab('Closed'));
    expect(within(screen.getByRole('listitem')).getByText(status)).toBeInTheDocument();
    expect(within(actionsFor('City council budget leak')).getByRole('button', { name: 'Reopen' })).toBeInTheDocument();
  });

  it('lets a closed decision be changed or reopened', async () => {
    renderInbox();
    await click('City council budget leak', 'Resolve');
    await userEvent.click(tab('Closed'));

    await click('City council budget leak', 'Change to dismissed');
    expect(within(screen.getByRole('listitem')).getByText('Dismissed')).toBeInTheDocument();

    await click('City council budget leak', 'Reopen');
    expect(tab('Closed')).toHaveTextContent('Closed (0)');

    await userEvent.click(tab('Needs review'));
    expect(within(screen.getByRole('listitem')).getByText('In review')).toBeInTheDocument();
  });
});
