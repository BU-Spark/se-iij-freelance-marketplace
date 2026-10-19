import { render, screen, within } from '@testing-library/react';
import RosterCard from './RosterCard';
import type { RosterMember } from '../../types/dashboard.types';

const marcus: RosterMember = {
  id: 'marcus',
  name: 'Marcus Thorne',
  specialty: 'Reporting',
  city: 'London',
  status: 'available',
  openHours: [{ start: 12, end: 18 }],
  note: 'Available 12:00 PM to 6:00 PM today',
};

describe('RosterCard', () => {
  it('shows the person, their status and note', () => {
    render(<RosterCard member={marcus} />);
    expect(screen.getByRole('heading', { name: 'Marcus Thorne' })).toBeInTheDocument();
    expect(screen.getByText('Reporting · London')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('MT')).toBeInTheDocument();
    expect(screen.getByText('Available 12:00 PM to 6:00 PM today')).toBeInTheDocument();
  });

  it('marks only the free time slots', () => {
    render(<RosterCard member={marcus} />);
    const slots = screen.getByRole('list', { name: /free time today/i });
    // 12p, 2p and 4p are free
    expect(within(slots).getAllByText('free')).toHaveLength(3);
    expect(within(slots).getAllByText('busy')).toHaveLength(3);
  });

  it('shows a busy person with no free slots', () => {
    render(<RosterCard member={{ ...marcus, status: 'busy', openHours: [] }} />);
    expect(screen.getByText('Busy')).toBeInTheDocument();
    expect(screen.queryAllByText('free')).toHaveLength(0);
  });
});
