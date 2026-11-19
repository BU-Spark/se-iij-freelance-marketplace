import type { AvailabilityException, Weekday } from '../types/availability.types';

/** Monday first, matching `availability.days` and the roster strips */
export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** A year of days off is more than anybody plans; anything past this is a runaway client */
export const MAX_EXCEPTIONS = 400;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when the value is a real calendar date written as YYYY-MM-DD */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const match = DATE_KEY.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  // rejects 2026-02-31 and friends, which Date would otherwise roll into March
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** YYYY-MM-DD for an instant, read on the clock where the person works */
export function dateKeyIn(instant: Date, timeZone: string | undefined): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(instant);

    const value = (type: string) => parts.find((part) => part.type === type)?.value.padStart(2, '0') ?? '';

    return `${value('year')}-${value('month')}-${value('day')}`;
  } catch {
    // an unusable zone falls back to the server clock rather than hiding the dates
    const month = String(instant.getMonth() + 1).padStart(2, '0');
    const day = String(instant.getDate()).padStart(2, '0');
    return `${instant.getFullYear()}-${month}-${day}`;
  }
}

/** Shift a date key by whole days; UTC arithmetic so daylight saving cannot move the date */
export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday, matching `availability.days` */
export function dayOfWeek(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** Reads `YYYY-MM` as a date key on the first of that month */
export function monthOf(dateKey: string): string {
  return `${dateKey.slice(0, 7)}-01`;
}

/** Shift to the first of another month; whole months only, so 31st never skips February */
export function addMonths(dateKey: string, months: number): string {
  const [year, month] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
}

/** Keeps one entry per date, latest wins, and drops anything that is not a real date */
export function sanitizeExceptions(value: unknown): AvailabilityException[] {
  if (!Array.isArray(value)) return [];

  const byDate = new Map<string, boolean>();

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue;

    const { date, available } = entry as { date?: unknown; available?: unknown };
    if (!isDateKey(date) || typeof available !== 'boolean') continue;

    byDate.set(date, available);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, MAX_EXCEPTIONS)
    .map(([date, available]) => ({ date, available }));
}

/** A "free right now" timer is about the next day or two, not a holiday booking */
export const MAX_FREE_NOW_HOURS = 72;

/** The timer choices offered wherever the flag can be turned on */
export type FreeNowPreset = '30m' | '1h' | '2h' | 'today' | 'custom';

export const FREE_NOW_PRESETS: { value: FreeNowPreset; label: string }[] = [
  { value: '30m', label: 'For 30 minutes' },
  { value: '1h', label: 'For 1 hour' },
  { value: '2h', label: 'For 2 hours' },
  { value: 'today', label: 'Until end of day' },
  { value: 'custom', label: 'Choose a time' },
];

/** Switching the flag on starts the timer at the end of the day unless the person picks otherwise */
export const DEFAULT_FREE_NOW_PRESET: FreeNowPreset = 'today';

/** The last instant of the local day `now` falls in; "today" on the person's own clock */
export function endOfToday(now: Date): Date {
  return new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - 1);
}

/** When a preset timer stops; 'custom' has no answer of its own because its picker supplies the time */
export function freeNowExpiry(preset: FreeNowPreset, now: Date): Date | null {
  switch (preset) {
    case '30m':
      return new Date(now.getTime() + 30 * 60_000);
    case '1h':
      return new Date(now.getTime() + 60 * 60_000);
    case '2h':
      return new Date(now.getTime() + 120 * 60_000);
    case 'today':
      return endOfToday(now);
    default:
      return null;
  }
}

/**
 * The flag only counts while its timer runs. No timer at all still counts, so a profile saved
 * before timers existed keeps showing the person as free.
 */
export function isFreeNow(
  availableNow: boolean,
  availableUntil: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!availableNow) return false;
  if (!availableUntil) return true;

  const until = availableUntil instanceof Date ? availableUntil : new Date(availableUntil);
  return Number.isNaN(until.getTime()) || until.getTime() > now.getTime();
}

/** Checks a timer the API was sent: absent or null means no timer, anything unusable is refused */
export function parseAvailableUntil(value: unknown, now: Date = new Date()): { valid: boolean; until: Date | null } {
  if (value === undefined || value === null || value === '') return { valid: true, until: null };
  if (typeof value !== 'string') return { valid: false, until: null };

  const until = new Date(value);
  const latest = now.getTime() + MAX_FREE_NOW_HOURS * 3_600_000;

  if (Number.isNaN(until.getTime()) || until.getTime() <= now.getTime() || until.getTime() > latest) {
    return { valid: false, until: null };
  }

  return { valid: true, until };
}

/** Which preset a saved timer came from, so the picker reopens on the choice that set it */
export function freeNowPresetOf(availableUntil: string | null | undefined, now: Date = new Date()): FreeNowPreset {
  if (!availableUntil) return DEFAULT_FREE_NOW_PRESET;

  const until = new Date(availableUntil);
  if (Number.isNaN(until.getTime())) return DEFAULT_FREE_NOW_PRESET;

  // a minute of slack, because a timer saved a moment ago has already lost a few seconds
  for (const preset of FREE_NOW_PRESETS) {
    const expiry = freeNowExpiry(preset.value, now);
    if (expiry && Math.abs(expiry.getTime() - until.getTime()) <= 60_000) return preset.value;
  }

  return 'custom';
}

/** "3:30 PM", or "Fri 3:30 PM" when the timer runs past today, read on `timeZone` */
export function freeUntilLabel(until: Date, now: Date = new Date(), timeZone?: string): string {
  const format = (date: Date, options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat('en-US', { ...options, ...(timeZone ? { timeZone } : {}) }).format(date);
    } catch {
      return new Intl.DateTimeFormat('en-US', options).format(date);
    }
  };

  const day = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
  const sameDay = format(until, day) === format(now, day);
  const time = { hour: 'numeric', minute: '2-digit' } as const;

  return sameDay ? format(until, time) : format(until, { weekday: 'short', ...time });
}

/** ISO instant to the value an <input type="datetime-local"> expects, on the browser's clock */
export function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A <input type="datetime-local"> value back to an ISO instant; null when it is not a real time */
export function fromDateTimeInput(value: string): string | null {
  if (!value) return null;

  // datetime-local strings carry no zone, so Date reads them on the browser's clock
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
