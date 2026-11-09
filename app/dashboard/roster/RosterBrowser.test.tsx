import type { ReactElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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

const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('RosterBrowser', () => {
  it('shows only the invited freelancers, with when they were added', () => {
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);
    expect(screen.queryByText('Jonah Park')).not.toBeInTheDocument();
    expect(screen.getByText(/added nov 1, 2026/i)).toBeInTheDocument();
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

  it('invites people who are off today too, and adds them to the roster', () => {
    renderPage(<RosterBrowser members={members} invitable={[outsider]} />);

    fireEvent.click(screen.getByRole('button', { name: /invite freelancers/i }));
    const dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('checkbox', { name: /jonah park/i }));
    expect(dialog.getByText('1 selected')).toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Add 1 to roster' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cardNames()).toEqual(['Amara Diallo', 'Jonah Park', 'Sarah Jenkins']);
    expect(screen.getByText('Added Jonah Park to your roster')).toBeInTheDocument();
    // nobody is left to invite
    expect(screen.getByRole('button', { name: /invite freelancers/i })).toBeDisabled();
  });

  it('tells an empty roster apart from an empty directory and a failed load', () => {
    const first = renderPage(<RosterBrowser members={[]} invitable={[outsider]} />);
    expect(screen.getByText(/no one on your roster yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /invite freelancers/i })[0]).toBeEnabled();
    first.unmount();

    const second = renderPage(<RosterBrowser members={[]} invitable={[]} />);
    expect(screen.getByText(/no freelancers have finished setting up/i)).toBeInTheDocument();
    second.unmount();

    renderPage(<RosterBrowser members={[]} invitable={[]} loadFailed />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be loaded/i);
  });
});
