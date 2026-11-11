import { fireEvent, render, screen, within } from '@testing-library/react';
import type { Weekday } from '../../types/availability.types';
import { addMonths, dateKeyIn, dayOfWeek, monthOf } from '../../utils/availability.utils';
import AvailabilityCalendar from './AvailabilityCalendar';

const WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as Weekday[];

const today = dateKeyIn(new Date(), 'UTC');
const thisMonth = monthOf(today);
const nextMonth = addMonths(thisMonth, 1);

const monthName = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`)
  );

const grid = () => screen.getByRole('list', { name: `Dates in ${monthName(thisMonth)}` });
const dayButtons = () => within(grid()).getAllByRole('button');
const todayButton = () => within(grid()).getByRole('button', { name: (name) => name.includes('today') });

describe('AvailabilityCalendar', () => {
  it('draws every date of the month, with the month starting in the right column', () => {
    render(<AvailabilityCalendar days={WEEK} exceptions={[]} timezone="UTC" onToggle={jest.fn()} />);

    const [year, month] = thisMonth.split('-').map(Number);
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();

    expect(dayButtons()).toHaveLength(length);
    expect(grid().querySelectorAll(':scope > li')).toHaveLength(dayOfWeek(thisMonth) + length);
  });

  it('says what today does on the usual week', () => {
    render(<AvailabilityCalendar days={WEEK} exceptions={[]} timezone="UTC" onToggle={jest.fn()} />);

    const weekday = dayOfWeek(today) <= 4;

    expect(todayButton()).toHaveAttribute(
      'aria-label',
      expect.stringContaining(weekday ? ': free, your usual week, today' : ': not free, your usual week, today')
    );
  });

  it('reports a dated override instead of the usual week', () => {
    render(
      <AvailabilityCalendar
        days={WEEK}
        exceptions={[{ date: today, available: true }]}
        timezone="UTC"
        onToggle={jest.fn()}
      />
    );

    expect(todayButton()).toHaveAttribute('aria-label', expect.stringContaining(': free, just for this date'));
  });

  it('hands the clicked date back to the form', () => {
    const onToggle = jest.fn();
    render(<AvailabilityCalendar days={WEEK} exceptions={[]} timezone="UTC" onToggle={onToggle} />);

    fireEvent.click(todayButton());

    expect(onToggle).toHaveBeenCalledWith(today);
  });

  it('moves forward a month but never into the past', () => {
    render(<AvailabilityCalendar days={WEEK} exceptions={[]} timezone="UTC" onToggle={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByRole('list', { name: `Dates in ${monthName(nextMonth)}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled();
  });
});
