import {
  addDays,
  addMonths,
  dateKeyIn,
  dayOfWeek,
  isDateKey,
  MAX_EXCEPTIONS,
  monthOf,
  sanitizeExceptions,
} from './availability.utils';

describe('isDateKey', () => {
  it('accepts real dates only', () => {
    expect(isDateKey('2026-11-04')).toBe(true);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2026-02-31')).toBe(false);
    expect(isDateKey('2026-13-01')).toBe(false);
    expect(isDateKey('04/11/2026')).toBe(false);
    expect(isDateKey(20261104)).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
});

describe('date maths', () => {
  it('moves whole days across month and year ends', () => {
    expect(addDays('2026-11-04', 1)).toBe('2026-11-05');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('moves whole months onto the first of the month', () => {
    expect(addMonths('2026-11-01', 1)).toBe('2026-12-01');
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01');
    expect(addMonths('2026-11-15', 3)).toBe('2027-02-01');
  });

  it('numbers the weekdays Monday first', () => {
    expect(dayOfWeek('2026-11-02')).toBe(0); // Monday
    expect(dayOfWeek('2026-11-04')).toBe(2); // Wednesday
    expect(dayOfWeek('2026-11-08')).toBe(6); // Sunday
  });

  it('trims a date key down to the first of its month', () => {
    expect(monthOf('2026-11-04')).toBe('2026-11-01');
  });
});

describe('dateKeyIn', () => {
  it('reads the date on the clock where the person works', () => {
    // 01:30 UTC on the 5th is still the evening of the 4th in New York
    const instant = new Date('2026-11-05T01:30:00.000Z');

    expect(dateKeyIn(instant, 'UTC')).toBe('2026-11-05');
    expect(dateKeyIn(instant, 'America/New_York')).toBe('2026-11-04');
  });

  it('falls back to the server clock for an unusable zone', () => {
    const instant = new Date(2026, 10, 4, 12, 0, 0);
    expect(dateKeyIn(instant, 'Mars/Olympus')).toBe('2026-11-04');
  });
});

describe('sanitizeExceptions', () => {
  it('keeps one entry per date, oldest first', () => {
    expect(
      sanitizeExceptions([
        { date: '2026-12-25', available: false },
        { date: '2026-11-21', available: true },
        { date: '2026-12-25', available: true },
        { date: 'someday', available: false },
        { date: '2027-01-01', available: 'yes' },
        null,
      ])
    ).toEqual([
      { date: '2026-11-21', available: true },
      { date: '2026-12-25', available: true },
    ]);
  });

  it('gives an empty list for anything that is not a list', () => {
    expect(sanitizeExceptions(undefined)).toEqual([]);
    expect(sanitizeExceptions('2026-12-25')).toEqual([]);
    expect(sanitizeExceptions({ date: '2026-12-25', available: false })).toEqual([]);
  });

  it('stops at the ceiling rather than storing an unbounded blob', () => {
    const everyDay = Array.from({ length: MAX_EXCEPTIONS + 10 }, (_, offset) => ({
      date: addDays('2026-11-04', offset),
      available: false,
    }));

    expect(sanitizeExceptions(everyDay)).toHaveLength(MAX_EXCEPTIONS);
  });
});
