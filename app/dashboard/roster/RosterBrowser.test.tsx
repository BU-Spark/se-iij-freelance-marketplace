import { fireEvent, render, screen, within } from '@testing-library/react';
import RosterBrowser from './RosterBrowser';
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

const cardNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('RosterBrowser', () => {
  it('lists everyone on the roster and counts them', () => {
    render(<RosterBrowser members={members} />);

    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Amara Diallo')).toBeInTheDocument();
    expect(screen.getByLabelText('2 on your roster')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 freelancers')).toBeInTheDocument();
  });

  it('searches across name, beat and city', () => {
    render(<RosterBrowser members={members} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'housing' } });
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.queryByText('Amara Diallo')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'dakar' } });
    expect(screen.getByText('Amara Diallo')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Jenkins')).not.toBeInTheDocument();
  });

  it('shows when each person was added to the roster', () => {
    render(<RosterBrowser members={[members[0], { ...members[1], invitedAt: undefined }]} />);

    expect(screen.getAllByText('Added Nov 1, 2026')).toHaveLength(1);
    expect(screen.getByText('On your roster')).toBeInTheDocument();
  });

  it('filters by any beat the person covers, not just the headline one', () => {
    render(<RosterBrowser members={members} />);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });

    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.queryByText('Amara Diallo')).not.toBeInTheDocument();
  });

  it('filters by location, and clears it again', () => {
    render(<RosterBrowser members={members} />);

    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Dakar' } });
    expect(cardNames()).toEqual(['Amara Diallo']);

    fireEvent.click(screen.getByRole('button', { name: /clear filters \(1\)/i }));
    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);
    expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
  });

  it('filters by availability with chips that count what the other filters leave', () => {
    render(<RosterBrowser members={members} />);
    const chips = within(screen.getByRole('group', { name: 'Availability' }));

    expect(chips.getByRole('button', { name: /^busy 1$/i })).toBeInTheDocument();
    fireEvent.click(chips.getByRole('button', { name: /^busy/i }));
    expect(cardNames()).toEqual(['Amara Diallo']);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });
    expect(chips.getByRole('button', { name: /^busy 0$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sorts by name, most recently added, or who is available first', () => {
    render(<RosterBrowser members={members} />);
    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'recent' } });
    expect(cardNames()).toEqual(['Amara Diallo', 'Sarah Jenkins']);

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'availability' } });
    expect(cardNames()).toEqual(['Sarah Jenkins', 'Amara Diallo']);
  });

  it('says so when the filters match nobody', () => {
    render(<RosterBrowser members={members} />);

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'nobody' } });

    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('tells an empty roster apart from a failed load', () => {
    const { rerender } = render(<RosterBrowser members={[]} />);
    expect(screen.getByText(/haven't invited anyone/i)).toBeInTheDocument();

    rerender(<RosterBrowser members={[]} loadFailed />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be loaded/i);
  });
});
