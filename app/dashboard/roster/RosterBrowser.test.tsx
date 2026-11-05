import { fireEvent, render, screen } from '@testing-library/react';
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
  ...overrides,
});

const members = [
  member(),
  member({ id: 'user-2', name: 'Amara Diallo', specialty: 'Photo', beats: ['Photo'], city: 'Dakar', status: 'busy' }),
];

describe('RosterBrowser', () => {
  it('lists everyone and counts who is around', () => {
    render(<RosterBrowser members={members} loadFailed={false} />);

    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.getByText('Amara Diallo')).toBeInTheDocument();
    const count = screen.getByText(
      (_, element) => element?.tagName === 'P' && /available or busy/i.test(element.textContent ?? '')
    );
    expect(count).toHaveTextContent(/^2 available or busy · 2 total$/);
    expect(screen.getByText('Showing 2 of 2 freelancers')).toBeInTheDocument();
  });

  it('filters by any beat the person covers, not just the headline one', () => {
    render(<RosterBrowser members={members} loadFailed={false} />);

    fireEvent.change(screen.getByLabelText('Beat'), { target: { value: 'Housing' } });

    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
    expect(screen.queryByText('Amara Diallo')).not.toBeInTheDocument();
  });

  it('filters by status and location', () => {
    render(<RosterBrowser members={members} loadFailed={false} />);

    fireEvent.change(screen.getByLabelText('Availability'), { target: { value: 'busy' } });
    expect(screen.getByText('Amara Diallo')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Jenkins')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Dakar' } });
    expect(screen.getByText('Amara Diallo')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Jenkins')).not.toBeInTheDocument();
  });

  it('says so when the filters match nobody', () => {
    render(<RosterBrowser members={members} loadFailed={false} />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'nobody' } });

    expect(screen.getByText(/no matches/i)).toBeInTheDocument();
  });

  it('tells an empty roster apart from a failed load', () => {
    const { rerender } = render(<RosterBrowser members={[]} loadFailed={false} />);
    expect(screen.getByText(/no freelancers have finished setting up/i)).toBeInTheDocument();

    rerender(<RosterBrowser members={[]} loadFailed />);
    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't be loaded/i);
  });
});
