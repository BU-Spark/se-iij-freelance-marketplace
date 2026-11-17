import {
  addDays,
  addMonths,
  dateKeyIn,
  dayOfWeek,
  endOfToday,
  freeNowExpiry,
  freeNowPresetOf,
  freeUntilLabel,
  fromDateTimeInput,
  isDateKey,
  isFreeNow,
  MAX_EXCEPTIONS,
  MAX_FREE_NOW_HOURS,
  monthOf,
  parseAvailableUntil,
  sanitizeExceptions,
  toDateTimeInput,
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

describe('endOfToday', () => {
  it('lands on the last instant of the local day', () => {
    const now = new Date(2026, 10, 4, 15, 0, 0);
    const end = endOfToday(now);

    expect(end.getTime()).toBeGreaterThan(now.getTime());
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(10);
    expect(end.getDate()).toBe(4);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(new Date(end.getTime() + 1).getHours()).toBe(0);
  });
});

describe('freeNowExpiry', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');

  it('counts preset timers from now', () => {
    expect(freeNowExpiry('30m', now)?.toISOString()).toBe('2026-11-04T12:30:00.000Z');
    expect(freeNowExpiry('1h', now)?.toISOString()).toBe('2026-11-04T13:00:00.000Z');
    expect(freeNowExpiry('2h', now)?.toISOString()).toBe('2026-11-04T14:00:00.000Z');
  });

  it('runs "today" to the local end of the day, and has no answer for a custom time', () => {
    expect(freeNowExpiry('today', now)?.getTime()).toBe(endOfToday(now).getTime());
    expect(freeNowExpiry('custom', now)).toBeNull();
  });
});

describe('isFreeNow', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');

  it('only counts while the flag is on and its timer is running', () => {
    expect(isFreeNow(false, null, now)).toBe(false);
    expect(isFreeNow(true, null, now)).toBe(true);
    expect(isFreeNow(true, '2026-11-04T12:30:00.000Z', now)).toBe(true);
    expect(isFreeNow(true, new Date('2026-11-04T11:59:00.000Z'), now)).toBe(false);
  });

  it('treats a timestamp it cannot read as no timer at all', () => {
    expect(isFreeNow(true, 'not a time', now)).toBe(true);
  });
});

describe('parseAvailableUntil', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');

  it('accepts a timer within the next few days, and no timer at all', () => {
    expect(parseAvailableUntil(undefined, now)).toEqual({ valid: true, until: null });
    expect(parseAvailableUntil(null, now)).toEqual({ valid: true, until: null });
    expect(parseAvailableUntil('', now)).toEqual({ valid: true, until: null });

    const until = new Date('2026-11-04T15:00:00.000Z');
    expect(parseAvailableUntil(until.toISOString(), now)).toEqual({ valid: true, until });
  });

  it('refuses a time in the past, an unreadable timestamp, and one too far off', () => {
    const tooLate = new Date(now.getTime() + (MAX_FREE_NOW_HOURS + 1) * 3_600_000);

    expect(parseAvailableUntil('2026-11-04T11:59:00.000Z', now).valid).toBe(false);
    expect(parseAvailableUntil('tomorrow', now).valid).toBe(false);
    expect(parseAvailableUntil(42, now).valid).toBe(false);
    expect(parseAvailableUntil(tooLate.toISOString(), now).valid).toBe(false);
  });
});

describe('freeNowPresetOf', () => {
  const now = new Date('2026-11-04T12:00:00.000Z');

  it('finds the preset a saved timer came from', () => {
    expect(freeNowPresetOf(null, now)).toBe('today');
    expect(freeNowPresetOf(freeNowExpiry('1h', now)?.toISOString(), now)).toBe('1h');
    expect(freeNowPresetOf(endOfToday(now).toISOString(), now)).toBe('today');
  });

  it('falls back to the custom picker for a time none of the presets would set', () => {
    expect(freeNowPresetOf(new Date(now.getTime() + 47 * 60_000).toISOString(), now)).toBe('custom');
  });
});

describe('freeUntilLabel', () => {
  it('shows a bare time for today, and the weekday once the timer runs past today', () => {
    const now = new Date('2026-11-04T12:00:00.000Z');

    expect(freeUntilLabel(new Date('2026-11-04T15:30:00.000Z'), now, 'UTC')).toBe('3:30 PM');
    expect(freeUntilLabel(new Date('2026-11-06T09:00:00.000Z'), now, 'UTC')).toBe('Fri 9:00 AM');
  });

  it('reads the clock in the zone it is given', () => {
    const now = new Date('2026-11-04T12:00:00.000Z');

    // 16:30 UTC is 11:30 in New York, still the same local day there
    expect(freeUntilLabel(new Date('2026-11-04T16:30:00.000Z'), now, 'America/New_York')).toBe('11:30 AM');
  });
});

describe('datetime-local helpers', () => {
  it('round-trips an instant through the browser-local input format', () => {
    expect(toDateTimeInput('nonsense')).toBe('');

    const iso = fromDateTimeInput('2026-11-04T15:30');
    expect(iso).not.toBeNull();
    expect(new Date(iso as string).getHours()).toBe(15);
    expect(new Date(iso as string).getMinutes()).toBe(30);
    expect(toDateTimeInput(iso as string)).toBe('2026-11-04T15:30');

    expect(fromDateTimeInput('')).toBeNull();
  });
});
