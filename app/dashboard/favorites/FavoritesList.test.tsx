import { fireEvent, render, screen, within } from '@testing-library/react';
import FavoritesList from './FavoritesList';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { RosterMember } from '../../types/dashboard.types';

const member = (overrides: Partial<RosterMember> = {}): RosterMember => ({
  id: 'user-1',
  name: 'Sarah Jenkins',
  specialty: 'Politics',
  beats: ['Politics', 'Housing'],
  city: 'Leeds, UK',
  status: 'available',
  openHours: [],
  note: '',
  weekDays: [],
  monthDays: [],
  invitedAt: '2026-11-01T10:00:00.000Z',
  inviteStatus: 'accepted',
  notified: false,
  ...overrides,
});

const members = [
  member(),
  member({ id: 'user-2', name: 'Amara Diallo', city: 'Dakar', inviteStatus: 'declined', notified: true }),
];

const KEY = 'favorite-freelancers:editor-1';

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  window.localStorage.setItem(KEY, JSON.stringify(['user-1', 'user-2']));
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

const renderList = (list = members, loadFailed = false) =>
  render(
    <ToastProvider>
      <FavoritesList editorId="editor-1" people={list} loadFailed={loadFailed} />
    </ToastProvider>
  );

const names = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('FavoritesList', () => {
  it('lists every favorite by name, with where each pre-invitation stands', () => {
    renderList();

    expect(names()).toEqual(['Amara Diallo', 'Sarah Jenkins']);
    const chips = within(screen.getByRole('group', { name: 'Pre-invitation' }));
    expect(chips.getByRole('button', { name: 'All 2' })).toBeInTheDocument();
    expect(chips.getByRole('button', { name: 'Declined 1' })).toBeInTheDocument();
  });

  it('searches and filters by pre-invitation', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /^declined/i }));
    expect(names()).toEqual(['Amara Diallo']);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'leeds' } });
    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('pre-invites a favorite and shows them waiting', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ saved: [{ freelancerId: 'user-1', invitedAt: '2026-11-27T09:00:00.000Z' }] }),
    });
    renderList([member()]);

    fireEvent.click(screen.getByRole('button', { name: 'Pre-invite Sarah Jenkins' }));

    expect(await screen.findByText('Pre-invitation sent to Sarah Jenkins')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Favorite freelancers' })).getByText('Pre-invited')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Pre-invite Sarah Jenkins' })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerIds: ['user-1'], notify: true }),
    });
  });

  it('says nothing was sent when the server changed no row', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ saved: [] }) });
    renderList([member()]);

    fireEvent.click(screen.getByRole('button', { name: 'Pre-invite Sarah Jenkins' }));

    expect(await screen.findByText(/nothing was sent/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pre-invite Sarah Jenkins' })).toBeEnabled();
  });

  it('removes a favorite on one click of the heart, leaving the roster alone', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Sarah Jenkins from favorites' }));

    expect(names()).toEqual(['Amara Diallo']);
    expect(window.localStorage.getItem(KEY)).toBe('["user-2"]');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists nobody until they are hearted, even people on the roster', () => {
    window.localStorage.clear();
    renderList();

    expect(names()).toEqual([]);
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
  });

  it('tells an empty list apart from a failed load', () => {
    const { unmount } = renderList([]);
    expect(screen.getByText('No favorites yet')).toBeInTheDocument();
    unmount();

    renderList([], true);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t be loaded/i);
  });
});
