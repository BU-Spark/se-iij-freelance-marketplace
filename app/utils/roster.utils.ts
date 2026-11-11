import type { AvailabilityStatus, HourWindow, RosterMember } from '../types/dashboard.types';
import type { Weekday } from '../types/availability.types';

/** The availability blob as stored today: a weekly pattern and one working window */
export type RosterAvailability = {
  timezone?: string;
  days?: string[];
  typicalWorkingWindow?: { startsAt?: string; endsAt?: string };
};

/** A freelancer as the roster query returns them */
export type RosterRow = {
  id: string;
  first_name: string;
  last_name: string;
  location: string | null;
  reporting_beats: string[] | null;
  beat_tags: string[] | null;
  work_mediums: string[] | null;
  availability: RosterAvailability | null;
  /** the person's own "free right now" flag, which beats the weekly pattern */
  available_now?: boolean | null;
};

/** Monday-first, matching the week strip and `availability.days` */
const WEEK: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SHORT_DAY: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

const str = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const list = (value: unknown) => (Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []);

/** Minutes since midnight for "09:00"; null when the string is not a time */
const minutesOf = (value: string | undefined): number | null => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(str(value));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

/** Keeps the row honest: a malformed blob is treated as "no availability" */
export function parseAvailability(raw: RosterAvailability | null): RosterAvailability | null {
  if (!raw || typeof raw !== 'object') return null;

  const days = list(raw.days).filter((day): day is Weekday => WEEK.includes(day as Weekday));
  const startsAt = minutesOf(raw.typicalWorkingWindow?.startsAt);
  const endsAt = minutesOf(raw.typicalWorkingWindow?.endsAt);

  if (days.length === 0 || startsAt === null || endsAt === null || endsAt <= startsAt) return null;

  return { timezone: str(raw.timezone) || undefined, days, typicalWorkingWindow: raw.typicalWorkingWindow };
}

/** The weekday and clock time where the freelancer is, not where the server is */
function localTime(now: Date, timeZone: string | undefined): { weekday: number; minutes: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

    return {
      weekday: SHORT_DAY[value('weekday')] ?? 0,
      minutes: (Number(value('hour')) % 24) * 60 + Number(value('minute')),
    };
  } catch {
    // an unusable time zone falls back to the server clock rather than hiding the person
    return { weekday: (now.getDay() + 6) % 7, minutes: now.getHours() * 60 + now.getMinutes() };
  }
}

/**
 * available = inside today's working window, busy = a working day but outside the window,
 * off = not a working day (or no availability at all).
 */
export function availabilityStatus(availability: RosterAvailability | null, now: Date): AvailabilityStatus {
  if (!availability) return 'off';

  const { weekday, minutes } = localTime(now, availability.timezone);
  const working = (availability.days ?? []).includes(WEEK[weekday]);
  if (!working) return 'off';

  const startsAt = minutesOf(availability.typicalWorkingWindow?.startsAt) ?? 0;
  const endsAt = minutesOf(availability.typicalWorkingWindow?.endsAt) ?? 0;

  return minutes >= startsAt && minutes < endsAt ? 'available' : 'busy';
}

/** Whole-hour blocks for the day strip, which draws 8a–6p */
export function openHours(availability: RosterAvailability | null): HourWindow[] {
  const startsAt = minutesOf(availability?.typicalWorkingWindow?.startsAt);
  const endsAt = minutesOf(availability?.typicalWorkingWindow?.endsAt);

  if (startsAt === null || endsAt === null || endsAt <= startsAt) return [];

  const start = Math.min(23, Math.floor(startsAt / 60));
  const end = Math.max(start + 1, Math.ceil(endsAt / 60));

  return [{ start, end }];
}

/** Seven booleans, Monday first */
export function weekDays(availability: RosterAvailability | null): boolean[] {
  const days = availability?.days ?? [];
  return WEEK.map((day) => days.includes(day));
}

/** The next 30 days, today first: the weekly pattern projected onto real dates */
export function monthDays(availability: RosterAvailability | null, now: Date): boolean[] {
  const days = new Set(availability?.days ?? []);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset);
    return days.has(WEEK[(date.getDay() + 6) % 7]);
  });
}

/** What the card says under the strips */
export function rosterNote(availability: RosterAvailability | null, status: AvailabilityStatus): string {
  if (!availability) return 'Hasn’t set their availability yet';

  const window = `${str(availability.typicalWorkingWindow?.startsAt)}–${str(availability.typicalWorkingWindow?.endsAt)}`;

  if (status === 'off') return 'Off today';
  if (status === 'busy') return `Outside their working hours (${window})`;

  return `Available ${window} today`;
}

/** The first beat they report on, falling back to the next thing we know about them */
export function specialtyOf(row: RosterRow): string {
  return list(row.reporting_beats)[0] ?? list(row.beat_tags)[0] ?? list(row.work_mediums)[0] ?? 'Freelancer';
}

/** Every beat this person covers, for the filter dropdown */
export function beatsOf(row: RosterRow): string[] {
  const beats = [...list(row.reporting_beats), ...list(row.beat_tags)];
  return [...new Set(beats)];
}

export function toRosterMember(row: RosterRow, now: Date = new Date()): RosterMember {
  const availability = parseAvailability(row.availability);
  // saying "I'm free right now" outranks whatever the weekly pattern says about this hour
  const freeNow = row.available_now === true;
  const status = freeNow ? 'available' : availabilityStatus(availability, now);

  return {
    id: row.id,
    name: `${str(row.first_name)} ${str(row.last_name)}`.trim() || 'Unnamed freelancer',
    specialty: specialtyOf(row),
    beats: beatsOf(row),
    city: str(row.location),
    status,
    openHours: status === 'off' ? [] : openHours(availability),
    note: freeNow ? 'Free right now' : rosterNote(availability, status),
    weekDays: weekDays(availability),
    monthDays: monthDays(availability, now),
  };
}
