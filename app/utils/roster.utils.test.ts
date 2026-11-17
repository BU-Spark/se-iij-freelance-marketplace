import {
  availabilityStatus,
  beatsOf,
  monthDayDates,
  monthDays,
  openHours,
  parseAvailability,
  rosterNote,
  specialtyOf,
  toRosterMember,
  weekDays,
  type RosterAvailability,
  type RosterRow,
} from './roster.utils';

/** Wednesday 12:00 UTC — absolute, so the timezone-aware assertions do not move */
const WEDNESDAY_NOON = new Date('2026-11-04T12:00:00.000Z');
/** Wednesday midday *wherever the test runs*, for the calendar and fallback cases */
const LOCAL_WEDNESDAY_NOON = new Date(2026, 10, 4, 12, 0, 0);

const weekday: RosterAvailability = {
  timezone: 'UTC',
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
};

const row: RosterRow = {
  id: 'user-1',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  location: 'Leeds, UK',
  beats: ['Politics', 'Housing'],
  beat_tags: ['Local'],
  work_mediums: ['Text'],
  availability: weekday,
};

describe('parseAvailability', () => {
  it('keeps the days it knows and treats anything malformed as no availability', () => {
    expect(parseAvailability({ ...weekday, days: ['monday', 'someday'] })?.days).toEqual(['monday']);
    expect(parseAvailability({ ...weekday, typicalWorkingWindow: { startsAt: '09:00' } })).toBeNull();
    expect(parseAvailability({ ...weekday, typicalWorkingWindow: { startsAt: '17:00', endsAt: '09:00' } })).toBeNull();
    expect(parseAvailability({ ...weekday, days: [] })).toBeNull();
    expect(parseAvailability(null)).toBeNull();
  });

  it('keeps only the dated overrides that are real dates and a yes/no', () => {
    const stored = {
      ...weekday,
      exceptions: [
        { date: '2026-12-25', available: false },
        { date: '25/12/2026', available: false },
        { date: '2026-12-26' },
        'nonsense',
      ],
    } as unknown as RosterAvailability;

    expect(parseAvailability(stored)?.exceptions).toEqual([{ date: '2026-12-25', available: false }]);
  });
});

describe('availabilityStatus', () => {
  it('is available inside the working window and busy outside it', () => {
    expect(availabilityStatus(weekday, WEDNESDAY_NOON)).toBe('available');
    expect(availabilityStatus(weekday, new Date('2026-11-04T18:00:00.000Z'))).toBe('busy');
  });

  it('is off on a day they do not work, or when availability was never set', () => {
    expect(availabilityStatus(weekday, new Date('2026-11-07T12:00:00.000Z'))).toBe('off');
    expect(availabilityStatus(null, WEDNESDAY_NOON)).toBe('off');
  });

  it('reads the clock where the freelancer is, not on the server', () => {
    // Monday 13:30 UTC is 08:30 in New York — before their working day starts
    const monday = new Date('2026-11-09T13:30:00.000Z');
    expect(availabilityStatus({ ...weekday, timezone: 'America/New_York' }, monday)).toBe('busy');
    expect(availabilityStatus({ ...weekday, timezone: 'UTC' }, monday)).toBe('available');
  });

  it('falls back to the server clock when the time zone is unusable', () => {
    expect(availabilityStatus({ ...weekday, timezone: 'Mars/Olympus' }, LOCAL_WEDNESDAY_NOON)).toBe('available');
  });

  it('takes a dated override over the weekly pattern', () => {
    const offToday = { ...weekday, exceptions: [{ date: '2026-11-04', available: false }] };
    expect(availabilityStatus(offToday, WEDNESDAY_NOON)).toBe('off');

    // Saturday, when the pattern has them off, but they said they are working
    const extraDay = { ...weekday, exceptions: [{ date: '2026-11-07', available: true }] };
    expect(availabilityStatus(extraDay, new Date('2026-11-07T12:00:00.000Z'))).toBe('available');

    // an override for another date leaves today alone
    const otherDay = { ...weekday, exceptions: [{ date: '2026-11-05', available: false }] };
    expect(availabilityStatus(otherDay, WEDNESDAY_NOON)).toBe('available');
  });
});

describe('strips', () => {
  it('turns the window into whole-hour blocks, rounding outwards', () => {
    expect(openHours(weekday)).toEqual([{ start: 9, end: 17 }]);
    expect(openHours(null)).toEqual([]);
    expect(openHours({ ...weekday, typicalWorkingWindow: { startsAt: '09:30', endsAt: '17:15' } })).toEqual([
      { start: 9, end: 18 },
    ]);
    expect(weekDays(weekday)).toEqual([true, true, true, true, true, false, false]);
    expect(weekDays(null)).toEqual([false, false, false, false, false, false, false]);
  });

  it('projects the pattern onto the next 30 days, today first', () => {
    const days = monthDays(weekday, LOCAL_WEDNESDAY_NOON);

    expect(days).toHaveLength(30);
    // Wed, Thu, Fri, Sat, Sun, Mon from today
    expect(days.slice(0, 6)).toEqual([true, true, true, false, false, true]);
  });

  it('has an empty month when there is no pattern', () => {
    expect(monthDays(null, WEDNESDAY_NOON).every((free) => free === false)).toBe(true);
  });

  it('lets dated exceptions win over the projected pattern', () => {
    const days = monthDays(
      {
        ...weekday,
        exceptions: [
          { date: '2026-11-05', available: false }, // a Thursday they took off
          { date: '2026-11-07', available: true }, // a Saturday they are working
        ],
      },
      WEDNESDAY_NOON
    );

    // Wed, Thu, Fri, Sat either side of the overrides
    expect(days.slice(0, 4)).toEqual([true, false, true, true]);
  });

  it('carries the real dates behind the month boxes', () => {
    expect(monthDayDates(weekday, WEDNESDAY_NOON).slice(0, 3)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06']);
    expect(monthDayDates(null, WEDNESDAY_NOON)).toHaveLength(30);
  });
});

describe('rosterNote', () => {
  it('describes today in plain words', () => {
    expect(rosterNote(weekday, 'available')).toBe('Available 09:00–17:00 today');
    expect(rosterNote(weekday, 'busy')).toBe('Outside their working hours (09:00–17:00)');
    expect(rosterNote(weekday, 'off')).toBe('Off today');
    expect(rosterNote(null, 'off')).toMatch(/hasn’t set their availability yet/i);
  });
});

describe('specialty and beats', () => {
  it('leads with the first reporting beat', () => {
    expect(specialtyOf(row)).toBe('Politics');
  });

  it('falls back through beat tags and mediums before giving up', () => {
    expect(specialtyOf({ ...row, beats: [] })).toBe('Local');
    expect(specialtyOf({ ...row, beats: [], beat_tags: [] })).toBe('Text');
    expect(specialtyOf({ ...row, beats: null, beat_tags: null, work_mediums: [] })).toBe('Freelancer');
  });

  it('collects every beat for the filter, without duplicates', () => {
    expect(beatsOf({ ...row, beat_tags: ['Local', 'Politics'] })).toEqual(['Politics', 'Housing', 'Local']);
  });
});

describe('toRosterMember', () => {
  it('builds the card from the row', () => {
    expect(toRosterMember(row, WEDNESDAY_NOON)).toEqual({
      id: 'user-1',
      name: 'Sarah Jenkins',
      specialty: 'Politics',
      beats: ['Politics', 'Housing', 'Local'],
      city: 'Leeds, UK',
      status: 'available',
      openHours: [{ start: 9, end: 17 }],
      note: 'Available 09:00–17:00 today',
      weekDays: [true, true, true, true, true, false, false],
      monthDays: monthDays(weekday, WEDNESDAY_NOON),
      monthDayDates: monthDayDates(weekday, WEDNESDAY_NOON),
    });
  });

  it('hides today’s hours when they are off', () => {
    const member = toRosterMember(row, new Date('2026-11-07T12:00:00.000Z'));

    expect(member.status).toBe('off');
    expect(member.openHours).toEqual([]);
    expect(member.note).toBe('Off today');
  });

  it('says someone is available when they have said they are free right now', () => {
    // a Saturday, when the weekly pattern has them off
    const weekend = new Date('2026-11-07T12:00:00.000Z');
    const freeNow = toRosterMember({ ...row, available_now: true }, weekend);

    expect(freeNow.status).toBe('available');
    expect(freeNow.note).toBe('Free right now');

    // and it does not turn being busy into being free
    expect(toRosterMember({ ...row, available_now: false }, weekend).status).toBe('off');
  });

  it('says when the free-right-now timer runs out, then lets the weekly pattern take over', () => {
    // a Saturday, when the weekly pattern has them off
    const weekend = new Date('2026-11-07T12:00:00.000Z');
    const until = toRosterMember({ ...row, available_now: true, available_until: '2026-11-07T16:30:00.000Z' }, weekend);

    expect(until.status).toBe('available');
    expect(until.note).toBe('Free until 4:30 PM');

    // once the timer has gone by, the flag no longer counts and Saturday is off again
    const expired = toRosterMember(
      { ...row, available_now: true, available_until: '2026-11-07T11:00:00.000Z' },
      weekend
    );
    expect(expired.status).toBe('off');
    expect(expired.note).toBe('Off today');
  });

  it('marks someone free right now even without a weekly pattern', () => {
    const member = toRosterMember({ ...row, availability: null, available_now: true }, WEDNESDAY_NOON);

    expect(member.status).toBe('available');
    expect(member.note).toBe('Free right now');
    expect(member.openHours).toEqual([]);
  });

  it('still renders someone with no availability, or no name', () => {
    const unknown = toRosterMember({ ...row, availability: null }, WEDNESDAY_NOON);
    expect(unknown).toMatchObject({ name: 'Sarah Jenkins', status: 'off', openHours: [] });
    expect(unknown.note).toMatch(/hasn’t set/i);

    const nameless = toRosterMember({ ...row, first_name: '', last_name: '', location: null }, WEDNESDAY_NOON);
    expect(nameless.name).toBe('Unnamed freelancer');
    expect(nameless.city).toBe('');
  });
});
