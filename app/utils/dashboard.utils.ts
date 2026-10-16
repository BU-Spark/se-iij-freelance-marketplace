import type { AssignmentStatus, DeskAssignment, HourWindow, Rate, RosterMember } from '../types/dashboard.types';

/** The availability bar shows six 2-hour slots: 8a, 10a, 12p, 2p, 4p, 6p */
export const SLOT_STARTS = [8, 10, 12, 14, 16, 18];

const SLOT_LENGTH = 2;

/** One boolean per slot: true when any free window overlaps that slot */
export function hourSlots(openHours: HourWindow[]): boolean[] {
  return SLOT_STARTS.map((slot) => openHours.some((w) => w.start < slot + SLOT_LENGTH && w.end > slot));
}

/** "8a", "12p", "6p" */
export function slotLabel(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? 'a' : 'p'}`;
}

/** "Marcus Thorne" -> "MT" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

const money = (n: number) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  });

const UNIT_LABEL: Record<Rate['unit'], string> = { word: ' / word', hour: ' / hr', flat: ' flat' };

/** "$1.10 / word (≈ $1,100 est.)" — flat rates skip the estimate since it's the same number */
export function formatRate(rate: Rate): string {
  const base = `${money(rate.amount)}${UNIT_LABEL[rate.unit]}`;
  return rate.unit === 'flat' ? base : `${base} (≈ ${money(rate.estimate)} est.)`;
}

/** "Tuesday, June 3" */
export function formatDeskDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

/** "Tonight, 11:00 PM", "Tomorrow, 10:00 AM", "Thu, 5:00 PM" or "Jun 20, 5:00 PM" */
export function formatDeadline(deadline: Date, now: Date = new Date()): string {
  const time = deadline.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const days = Math.round((startOfDay(deadline) - startOfDay(now)) / DAY_MS);

  if (days === 0) return `${deadline.getHours() >= 17 ? 'Tonight' : 'Today'}, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days > 1 && days < 7) return `${deadline.toLocaleDateString('en-US', { weekday: 'short' })}, ${time}`;
  return `${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

export function countByStatus(assignments: DeskAssignment[]): Record<AssignmentStatus, number> {
  const counts: Record<AssignmentStatus, number> = { open: 0, invited: 0, assigned: 0 };
  assignments.forEach((a) => counts[a.status]++);
  return counts;
}

/** Everyone on the roster who isn't marked off */
export function countOnRoster(roster: RosterMember[]): number {
  return roster.filter((m) => m.status !== 'off').length;
}
