import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AssignmentsColumn from './AssignmentsColumn';
import DeskSearch from './DeskSearch';
import { DeskQueryProvider } from './deskQuery';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import { SAMPLE_ASSIGNMENTS } from '../../../test/fixtures/assignments';
import { SAMPLE_ROSTER as ROSTER } from '../../../test/fixtures/roster';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const originalFetch = global.fetch;
const fetchMock = jest.fn();

const tab = (name: string) =>
  within(screen.getByRole('group', { name: /filter assignments/i })).getByRole('button', { name });
const cardFor = (title: string) => screen.getByRole('heading', { level: 3, name: title }).closest('article')!;

describe('AssignmentsColumn', () => {
  // the layout choice is remembered in localStorage, so start each test from the cards
  beforeEach(() => {
    window.localStorage.clear();
    push.mockClear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ saved: true }) });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
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

  it('opens Review candidates and assigns someone', async () => {
    render(<AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />);
    const election = 'Election Night Live Coverage: District 4';

    fireEvent.click(within(cardFor(election)).getByRole('button', { name: /review candidates/i }));
    const dialog = screen.getByRole('dialog', { name: election });
    expect(within(dialog).getByText(/4 invited · 3 signaled interest/)).toBeInTheDocument();
    // Jonah hasn't answered, so he can't be assigned yet
    expect(within(dialog).getByRole('button', { name: 'Assign Jonah Weiss' })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Assign Marcus Thorne' }));

    // saved first, then the card changes
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assignments/election-d4/assign',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ memberId: 'marcus' }) })
    );
    expect(within(cardFor(election)).getByText('Assigned to Marcus Thorne')).toBeInTheDocument();
  });

  it('keeps the popup open and says so when the assignment will not save', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'nope' }) });
    render(
      <ToastProvider>
        <AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />
      </ToastProvider>
    );
    const election = 'Election Night Live Coverage: District 4';

    fireEvent.click(within(cardFor(election)).getByRole('button', { name: /review candidates/i }));
    const dialog = screen.getByRole('dialog', { name: election });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Assign Marcus Thorne' }));

    expect(await screen.findByText(/could not assign this freelancer/i)).toBeInTheDocument();
    // still open, and the card still says nobody is on it
    expect(screen.getByRole('dialog', { name: election })).toBeInTheDocument();
    expect(within(cardFor(election)).queryByText(/assigned to/i)).not.toBeInTheDocument();
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

  it('loads the next page when Load more is clicked', async () => {
    const first = SAMPLE_ASSIGNMENTS[0];
    const next = { ...first, id: 'next-1', title: 'Next page assignment' };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [next], nextCursor: null }),
    });

    render(<AssignmentsColumn assignments={[first]} roster={ROSTER} nextCursor="page-2" total={2} />);

    expect(screen.getByText('Showing 1 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('heading', { level: 3, name: 'Next page assignment' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assignments?after=page-2',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('filters the list with the desk search', () => {
    render(
      <DeskQueryProvider>
        <DeskSearch />
        <AssignmentsColumn assignments={SAMPLE_ASSIGNMENTS} roster={ROSTER} />
      </DeskQueryProvider>
    );

    fireEvent.change(screen.getByRole('searchbox', { name: /search assignments and roster/i }), {
      target: { value: 'transit' },
    });

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 3, name: /transit ridership/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: /search assignments and roster/i }), {
      target: { value: 'nothing matches this' },
    });
    expect(screen.getByText(/no assignments match/i)).toBeInTheDocument();
  });
});
