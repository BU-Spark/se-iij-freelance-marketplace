import { ASSIGNMENTS, ROSTER } from '../dashboard/constants';
import {
  countByStatus,
  countOnRoster,
  formatDeadline,
  formatDeskDate,
  formatRate,
  hourSlots,
  initials,
  slotLabel,
} from './dashboard.utils';

describe('dashboard utils', () => {
  describe('hourSlots', () => {
    it('marks every 2-hour slot that overlaps a free window', () => {
      expect(hourSlots([{ start: 12, end: 18 }])).toEqual([false, false, true, true, true, false]);
    });

    it('handles split windows and partial overlaps', () => {
      expect(
        hourSlots([
          { start: 9, end: 10 },
          { start: 17, end: 20 },
        ])
      ).toEqual([true, false, false, false, true, true]);
    });

    it('returns all false when there is no free time', () => {
      expect(hourSlots([])).toEqual([false, false, false, false, false, false]);
    });
  });

  it('labels slots in short 12h form', () => {
    expect([8, 10, 12, 14, 16, 18].map(slotLabel)).toEqual(['8a', '10a', '12p', '2p', '4p', '6p']);
  });

  it('builds initials from the first two names', () => {
    expect(initials('Marcus Thorne')).toBe('MT');
    expect(initials('  amara  diallo ')).toBe('AD');
    expect(initials('Cher')).toBe('C');
  });

  it('formats per-word, hourly and flat rates', () => {
    expect(formatRate({ amount: 1.1, unit: 'word', estimate: 1100 })).toBe('$1.10 / word (≈ $1,100 est.)');
    expect(formatRate({ amount: 85, unit: 'hour', estimate: 300 })).toBe('$85 / hr (≈ $300 est.)');
    expect(formatRate({ amount: 450, unit: 'flat', estimate: 450 })).toBe('$450 flat');
  });

  it('formats the desk date', () => {
    expect(formatDeskDate(new Date(2025, 5, 3))).toBe('Tuesday, June 3');
  });

  describe('formatDeadline', () => {
    const now = new Date(2025, 5, 3, 9, 0); // Tue Jun 3, 9 AM

    it('says tonight / today for same-day deadlines', () => {
      expect(formatDeadline(new Date(2025, 5, 3, 23, 0), now)).toBe('Tonight, 11:00 PM');
      expect(formatDeadline(new Date(2025, 5, 3, 13, 30), now)).toBe('Today, 1:30 PM');
    });

    it('uses tomorrow, then weekday, then a date', () => {
      expect(formatDeadline(new Date(2025, 5, 4, 10, 0), now)).toBe('Tomorrow, 10:00 AM');
      expect(formatDeadline(new Date(2025, 5, 5, 17, 0), now)).toBe('Thu, 5:00 PM');
      expect(formatDeadline(new Date(2025, 5, 20, 17, 0), now)).toBe('Jun 20, 5:00 PM');
    });
  });

  it('counts assignments by status', () => {
    expect(countByStatus(ASSIGNMENTS)).toEqual({ open: 2, invited: 1, assigned: 1 });
  });

  it('counts everyone not marked off as on the roster', () => {
    expect(countOnRoster(ROSTER)).toBe(ROSTER.length - 1);
  });
});
