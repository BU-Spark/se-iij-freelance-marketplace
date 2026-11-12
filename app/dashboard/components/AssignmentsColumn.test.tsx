import { fireEvent, render, screen, within } from '@testing-library/react';
import AssignmentsColumn from './AssignmentsColumn';
import { SAMPLE_ASSIGNMENTS } from '../../../test/fixtures/assignments';
import { SAMPLE_ROSTER as ROSTER } from '../../../test/fixtures/roster';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter assignments/i })).getByRole('button', { name });
const cardFor = (title: string) => screen.getByRole('heading', { name: title }).closest('article')!;

describe('AssignmentsColumn', () => {
  // the layout choice is remembered in localStorage, so start each test from the cards
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
  });

  it('shows every assignment on the All tab', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    expect(tab('All')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('article')).toHaveLength(SAMPLE_ASSIGNMENTS.length);
  });

  it('shows only matching assignments when a tab is clicked', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    fireEvent.click(tab('Invited'));
    const invited = SAMPLE_ASSIGNMENTS.filter((a) => a.status === 'invited');
    expect(screen.getAllByRole('article')).toHaveLength(invited.length);
  });

  it('says so when a tab is empty', () => {
    render(<AssignmentsColumn assignments={[]} roster={ROSTER} />);
    fireEvent.click(tab('Open'));
    expect(screen.getByText('No open assignments.')).toBeInTheDocument();
  });

  it('shows who an assigned card belongs to', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    expect(
      within(cardFor('Data Check: Transit ridership numbers')).getByText('Assigned to Priya Natarajan')
    ).toBeInTheDocument();
  });

  it('opens Review candidates and assigns someone', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
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

  it('switches to the dense table view and remembers the choice', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'table' }));

    const table = screen.getByRole('table', { name: 'Assignments' });
    expect(within(table).getAllByRole('row')).toHaveLength(SAMPLE_ASSIGNMENTS.length + 1);
    expect(within(table).getByRole('columnheader', { name: 'Deadline' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Candidates' })).toBeInTheDocument();
    expect(within(table).getByText('Assigned to')).toBeInTheDocument();
    expect(window.localStorage.getItem('desk-assignment-view')).toBe('"table"');

    fireEvent.click(screen.getByRole('button', { name: 'comfort' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(SAMPLE_ASSIGNMENTS.length);
  });

  it('opens Review candidates from a table row too', () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    fireEvent.click(screen.getByRole('button', { name: 'table' }));

    const table = screen.getByRole('table', { name: 'Assignments' });
    const row = within(table).getByRole('row', { name: /Election Night Live Coverage: District 4/i });
    fireEvent.click(within(row).getByRole('button', { name: 'Review' }));

    expect(screen.getByRole('dialog', { name: /Election Night Live Coverage: District 4/ })).toBeInTheDocument();
  });

  it('opens the assignment drawer when a table row is clicked', () => {
    const linked = { ...SAMPLE_ASSIGNMENTS[0], href: '/dashboard?assignment=election-d4' };
    render(<AssignmentsColumn assignments={[linked]} roster={ROSTER} />);

    fireEvent.click(screen.getByRole('button', { name: 'table' }));
    const table = screen.getByRole('table', { name: 'Assignments' });
    fireEvent.click(within(table).getByText(linked.title));

    expect(push).toHaveBeenCalledWith('/dashboard?assignment=election-d4', { scroll: false });
  });
});
