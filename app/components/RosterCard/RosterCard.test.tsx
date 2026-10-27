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
  weekDays: [true, true, false, true, true, false, false],
  monthDays: Array.from({ length: 30 }, (_, i) => i % 2 === 0),
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
  it('shows the week view with free days marked', () => {
    render(<RosterCard member={marcus} view="week" />);
    const week = screen.getByRole('list', { name: /free days this week/i });
    // Marcus is free Mon, Tue, Thu, Fri
    expect(within(week).getByText('Monday free')).toBeInTheDocument();
    expect(within(week).getByText('Wednesday busy')).toBeInTheDocument();
    expect(within(week).getAllByText(/ free$/)).toHaveLength(4);
  });

  it('shows the month view with one box per day', () => {
    render(<RosterCard member={marcus} view="month" />);
    const month = screen.getByRole('list', { name: /free days this month/i });
    expect(within(month).getAllByRole('listitem')).toHaveLength(30);
    expect(within(month).getAllByText(/ free$/)).toHaveLength(15);
  });

  it('only shows the note in the day view', () => {
    render(<RosterCard member={marcus} view="week" />);
    expect(screen.queryByText(marcus.note)).not.toBeInTheDocument();
  });
});
