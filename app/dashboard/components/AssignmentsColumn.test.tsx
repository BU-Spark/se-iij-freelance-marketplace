import { fireEvent, render, screen, within } from '@testing-library/react';
import AssignmentsColumn from './AssignmentsColumn';
import { ASSIGNMENTS, ROSTER } from '../constants';

const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter assignments/i })).getByRole('button', { name });
const cardFor = (title: string) => screen.getByRole('heading', { name: title }).closest('article')!;

describe('AssignmentsColumn', () => {
  it('shows every assignment on the All tab', () => {
    render(<AssignmentsColumn assignments={ASSIGNMENTS} roster={ROSTER} />);
    expect(tab('All')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('article')).toHaveLength(ASSIGNMENTS.length);
  });

  it('shows only matching assignments when a tab is clicked', () => {
    render(<AssignmentsColumn assignments={ASSIGNMENTS} roster={ROSTER} />);
    fireEvent.click(tab('Invited'));
    const invited = ASSIGNMENTS.filter((a) => a.status === 'invited');
    expect(screen.getAllByRole('article')).toHaveLength(invited.length);
  });

  it('says so when a tab is empty', () => {
    render(<AssignmentsColumn assignments={[]} roster={ROSTER} />);
    fireEvent.click(tab('Open'));
    expect(screen.getByText('No open assignments.')).toBeInTheDocument();
  });

  it('shows who an assigned card belongs to', () => {
    render(<AssignmentsColumn assignments={ASSIGNMENTS} roster={ROSTER} />);
    expect(
      within(cardFor('Data Check: Transit ridership numbers')).getByText('Assigned to Priya Natarajan')
    ).toBeInTheDocument();
  });

  it('opens Review candidates and assigns someone', () => {
    render(<AssignmentsColumn assignments={ASSIGNMENTS} roster={ROSTER} />);
    const election = 'Election Night Live Coverage: District 4';

    fireEvent.click(within(cardFor(election)).getByRole('button', { name: /review candidates/i }));
    const dialog = screen.getByRole('dialog', { name: election });
    expect(within(dialog).getByText(/4 invited · 3 signaled interest/)).toBeInTheDocument();
    // Jonah hasn't answered, so he can't be assigned yet
    expect(within(dialog).getByRole('button', { name: 'Assign Jonah Weiss' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Assign Marcus Thorne' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(cardFor(election)).getByText('Assigned to Marcus Thorne')).toBeInTheDocument();
  });
});
