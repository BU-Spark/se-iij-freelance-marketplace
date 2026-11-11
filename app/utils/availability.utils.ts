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
