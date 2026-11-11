import type { ReactElement } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import TalentSearch from './TalentSearch';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { TalentFilterOptions, TalentMember } from '../../types/talent.types';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/talent',
}));

const member = (overrides: Partial<TalentMember> = {}): TalentMember => ({
  id: 'user-1',
  name: 'Sarah Jenkins',
  specialty: 'Politics',
  beats: ['Politics', 'Housing'],
  city: 'Leeds, UK',
  status: 'available',
  openHours: [{ start: 9, end: 17 }],
  note: 'Available 09:00–17:00 today',
  weekDays: [true, true, true, true, true, false, false],
  monthDays: Array(30).fill(true),
  mediums: ['Text', 'Audio'],
  availableNow: true,
  profile: { shortBio: '', longBio: '', communityCovered: '', rate: '', tools: [], portfolio: [] },
  ...overrides,
});

const options: TalentFilterOptions = {
  beats: ['Housing', 'Politics'],
  mediums: ['Audio', 'Text'],
  locations: ['Dakar', 'Leeds, UK'],
};

const renderPage = (ui: ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ invited: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('TalentSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    replace.mockClear();
  });

  afterEach(() => jest.useRealTimers());

  it('shows the results, collapsed, with a count', () => {
    renderPage(
      <TalentSearch
        filters={{}}
        options={options}
        results={[member(), member({ id: 'user-2', name: 'Amara Diallo' })]}
      />
    );

    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Sarah Jenkins',
      'Amara Diallo',
    ]);
    expect(screen.getAllByRole('button', { name: 'View profile' })).toHaveLength(2);
    expect(screen.getByText('2 freelancers')).toBeInTheDocument();
  });

  it('waits for typing to pause before searching, then puts the search in the URL', () => {
    renderPage(<TalentSearch filters={{}} options={options} results={[member()]} />);

    const search = screen.getByLabelText('Search');
    fireEvent.change(search, { target: { value: 'hou' } });
    fireEvent.change(search, { target: { value: 'housing' } });
    expect(replace).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(300));

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/dashboard/talent?q=housing', { scroll: false });
  });

  it('applies dropdowns and the free-now chip straight away, keeping the other filters', () => {
    renderPage(<TalentSearch filters={{ q: 'housing' }} options={options} results={[member()]} />);

    fireEvent.change(screen.getByLabelText('Medium'), { target: { value: 'Audio' } });
    expect(replace).toHaveBeenLastCalledWith('/dashboard/talent?q=housing&medium=Audio', { scroll: false });

    fireEvent.click(screen.getByRole('button', { name: /free right now/i }));
    expect(replace).toHaveBeenLastCalledWith('/dashboard/talent?q=housing&available=1', { scroll: false });
  });

  it('clears every filter at once', () => {
    renderPage(
      <TalentSearch filters={{ q: 'housing', beat: 'Politics', availableNow: true }} options={options} results={[]} />
    );

    expect(screen.getByText(/no freelancers match that search/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters (3)' }));

    expect(replace).toHaveBeenLastCalledWith('/dashboard/talent', { scroll: false });
    expect(screen.getByLabelText('Search')).toHaveValue('');
  });

  it('invites a freelancer and marks the card', async () => {
    jest.useRealTimers();
    renderPage(<TalentSearch filters={{}} options={options} results={[member()]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Invite Sarah Jenkins to your roster' }));

    expect(await screen.findByText('Invited')).toBeInTheDocument();
    expect(screen.getByText('Invited Sarah Jenkins to your roster')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerIds: ['user-1'] }),
    });
  });

  it('shows freelancers who are already on the roster as invited', () => {
    renderPage(<TalentSearch filters={{}} options={options} results={[member()]} invitedIds={['user-1']} />);

    expect(screen.getByText('Invited')).toBeInTheDocument();
  });

  it('reports a refused invite and leaves the card alone', async () => {
    jest.useRealTimers();
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Only editors have a roster.' }) });
    renderPage(<TalentSearch filters={{}} options={options} results={[member()]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Invite Sarah Jenkins to your roster' }));

    expect(await screen.findByText('Only editors have a roster.')).toBeInTheDocument();
    expect(screen.queryByText('Invited')).not.toBeInTheDocument();
  });

  it('says when nobody has joined yet, and when the search failed', () => {
    const { unmount } = renderPage(<TalentSearch filters={{}} options={options} results={[]} />);
    expect(screen.getByText(/no freelancers have finished setting up/i)).toBeInTheDocument();
    unmount();

    renderPage(<TalentSearch filters={{}} options={options} results={[]} loadFailed />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t be searched/i);
  });
});
