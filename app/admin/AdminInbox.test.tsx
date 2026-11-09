import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('AdminInbox', () => {
  it('opens on flagged pitches with a count on each tab', () => {
    render(<AdminInbox reports={reports} />);

    expect(tab('Pitches')).toHaveAttribute('aria-pressed', 'true');
    expect(within(tab('Accounts')).getByText('2')).toBeInTheDocument();
    expect(within(tab('Assignments')).getByText('0')).toBeInTheDocument();
    expect(screen.getByText('3 flags waiting for review')).toBeInTheDocument();

    const [row] = screen.getAllByRole('listitem');
    expect(row).toHaveTextContent('City council budget leak');
    expect(row).toHaveTextContent('Looks like spam');
    expect(row).toHaveTextContent('Reported by Ada Editor');
    expect(row).toHaveTextContent('New');
  });

  it('switches to the chosen type, and shows an empty state when there is none', async () => {
    render(<AdminInbox reports={reports} />);

    await userEvent.click(tab('Accounts'));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('In review')).toBeInTheDocument();
    expect(screen.queryByText('City council budget leak')).not.toBeInTheDocument();

    await userEvent.click(tab('Assignments'));
    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
