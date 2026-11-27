import type { ReactElement } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import RosterBrowser from './RosterBrowser';
import { ToastProvider } from '../../components/Toast/ToastProvider';
import type { RosterMember } from '../../types/dashboard.types';

const member = (overrides: Partial<RosterMember> = {}): RosterMember => ({
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
  invitedAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
});

const members = [
  member(),
  member({
    id: 'user-2',
    name: 'Amara Diallo',
    specialty: 'Photo',
    beats: ['Photo'],
    city: 'Dakar',
    status: 'busy',
    invitedAt: '2026-11-05T10:00:00.000Z',
  }),
];

const outsider = member({ id: 'user-3', name: 'Jonah Park', status: 'off', invitedAt: undefined });

const renderPage = (ui: ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  window.localStorage.clear();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ saved: [] }) });
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('RosterBrowser', () => {
  it('shows only the invited freelancers, with when they were added', () => {
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);
    expect(screen.queryByText('Jonah Park')).not.toBeInTheDocument();
    expect(screen.getByText(/saved nov 1, 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 freelancers')).toBeInTheDocument();
  });

  it('searches across name, beat and city', () => {
    renderPage(<RosterBrowser members={members} invitable={[]} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'housing' } });
    expect(cardNames()).toEqual(['Sarah Jenkins']);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'dakar' } });
    expect(cardNames()).toEqual(['Amara Diallo']);
  });

  it('filters by beat and location, and clears them all at once', () => {
    renderPage(<RosterBrowser members={members} invitable={[]} />);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });
    expect(cardNames()).toEqual(['Sarah Jenkins']);

    fireEvent.click(screen.getByRole('button', { name: /clear filters \(1\)/i }));
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Dakar' } });
    expect(cardNames()).toEqual(['Amara Diallo']);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });
    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('lists every US state under Location, and filters by the state a city is in', () => {
    const texan = member({ id: 'user-4', name: 'Rosa Vega', city: 'Austin, TX' });
    renderPage(<RosterBrowser members={[...members, texan]} invitable={[]} />);
    const location = screen.getByLabelText('Location');

    expect(within(location).getByRole('group', { name: 'US states' }).querySelectorAll('option')).toHaveLength(51);
    expect(within(location).getByRole('option', { name: 'Wyoming' })).toBeInTheDocument();
    // places outside the US keep their own option
    expect(within(location).getByRole('option', { name: 'Dakar' })).toBeInTheDocument();
    expect(within(location).queryByRole('option', { name: 'Austin, TX' })).not.toBeInTheDocument();

    fireEvent.change(location, { target: { value: 'Texas' } });
    expect(cardNames()).toEqual(['Rosa Vega']);

    fireEvent.change(location, { target: { value: 'Alaska' } });
    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('filters by availability with chips that count what the other filters leave', () => {
    renderPage(<RosterBrowser members={members} invitable={[]} />);
    const chips = within(screen.getByRole('group', { name: 'Availability' }));

    expect(chips.getByRole('button', { name: /^busy 1$/i })).toBeInTheDocument();
    fireEvent.click(chips.getByRole('button', { name: /^busy/i }));
    expect(cardNames()).toEqual(['Amara Diallo']);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });
    expect(chips.getByRole('button', { name: /^busy 0$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sorts by most recently added', () => {
    renderPage(<RosterBrowser members={members} invitable={[]} />);

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'recent' } });
    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'availability' } });
    expect(cardNames()).toEqual(['Sarah Jenkins', 'Amara Diallo']);
  });

  it('saves people who are off today too, straight onto the roster', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        saved: [{ freelancerId: 'user-3', invitedAt: '2026-11-11T09:00:00.000Z', status: 'accepted', notified: false }],
      }),
    });
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    fireEvent.click(screen.getByRole('button', { name: /add freelancers/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('checkbox', { name: /jonah park/i }));
    expect(dialog.getByText('1 selected')).toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Add 1 to roster' }));

    expect(await screen.findByText('Saved Jonah Park to your roster')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // saving is immediate: nobody has to accept before they are on the roster
    expect(cardNames()).toEqual(['Amara Diallo', 'Jonah Park', 'Sarah Jenkins']);
    expect(screen.queryByRole('heading', { name: /waiting on a response/i })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerIds: ['user-3'], notify: false }),
    });
    // nobody is left to add
    expect(screen.getByRole('button', { name: /add freelancers/i })).toBeDisabled();
  });

  it('can optionally notify the freelancer, and shows the notification state', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        saved: [{ freelancerId: 'user-3', invitedAt: '2026-11-11T09:00:00.000Z', status: 'pending', notified: true }],
      }),
    });
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    fireEvent.click(screen.getByRole('button', { name: /add freelancers/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('checkbox', { name: /jonah park/i }));
    fireEvent.click(dialog.getByRole('checkbox', { name: /send a pre-invitation/i }));
    fireEvent.click(dialog.getByRole('button', { name: 'Add 1 to roster' }));

    expect(await screen.findByText('Saved Jonah Park and sent a pre-invitation')).toBeInTheDocument();
    expect(screen.getByText('Pre-invited')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancerIds: ['user-3'], notify: true }),
    });
  });

  it('records what a saved freelancer answered without removing them', () => {
    const answered = member({ id: 'user-6', name: 'Tomás Reyes', inviteStatus: 'accepted', notified: true });
    const declined = member({ id: 'user-7', name: 'Rosa Vega', inviteStatus: 'declined', notified: true });
    renderPage(<RosterBrowser members={[...members, answered, declined]} invitable={[]} />);

    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Declined')).toBeInTheDocument();
    // a decline is informational: the editor still has them on the roster until they remove them
    expect(screen.getByRole('button', { name: 'Remove Rosa Vega from your roster' })).toBeInTheDocument();
  });

  it('makes nobody a favorite until their heart is clicked', () => {
    renderPage(<RosterBrowser editorId="editor-1" members={members} invitable={[]} />);
    const heart = screen.getByRole('button', { name: 'Add Sarah Jenkins to favorites' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(heart);

    expect(screen.getByRole('button', { name: 'Remove Sarah Jenkins from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(window.localStorage.getItem('favorite-freelancers:editor-1')).toBe('["user-1"]');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pre-invites someone already saved', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ saved: [{ freelancerId: 'user-1', invitedAt: '2026-11-27T09:00:00.000Z' }] }),
    });
    renderPage(<RosterBrowser members={members} invitable={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pre-invite Sarah Jenkins' }));

    expect(await screen.findByText('Pre-invitation sent to Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Pre-invited')).toBeInTheDocument();
  });

  it('keeps the add dialog open when the roster API refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Only editors have a roster.' }) });
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    fireEvent.click(screen.getByRole('button', { name: /add freelancers/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('checkbox', { name: /jonah park/i }));
    fireEvent.click(dialog.getByRole('button', { name: 'Add 1 to roster' }));

    expect(await screen.findByText('Only editors have a roster.')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);
  });

  it('asks before removing someone, then offers them in the directory again', async () => {
    renderPage(<RosterBrowser members={members} invitable={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Sarah Jenkins from your roster' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(cardNames()).toContain('Sarah Jenkins');

    fireEvent.click(screen.getByRole('button', { name: 'Remove Sarah Jenkins from your roster' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }));
    await waitFor(() => expect(cardNames()).toEqual(['Amara Diallo']));
    expect(fetchMock).toHaveBeenCalledWith('/api/roster/invites/user-1', { method: 'DELETE' });

    fireEvent.click(screen.getByRole('button', { name: /add freelancers/i }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('checkbox', { name: /sarah jenkins/i })).not.toBeChecked();

    fireEvent.change(dialog.getByLabelText('Search freelancers'), { target: { value: 'zzz' } });
    expect(dialog.getByText(/no freelancer matches/i)).toBeInTheDocument();
  });

  it('tells an empty roster apart from an empty directory and a failed load', () => {
    const first = renderPage(<RosterBrowser members={[]} invitable={[outsider]} />);
    expect(screen.getByText(/no one on your roster yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /add freelancers/i })[0]).toBeEnabled();
    first.unmount();

    const second = renderPage(<RosterBrowser members={[]} invitable={[]} />);
    expect(screen.getByText(/no freelancers have finished setting up/i)).toBeInTheDocument();
    second.unmount();

    renderPage(<RosterBrowser members={[]} invitable={[]} loadFailed />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be loaded/i);
  });
});
