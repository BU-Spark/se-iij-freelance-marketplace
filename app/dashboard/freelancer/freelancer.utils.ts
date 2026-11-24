import type { DeskAssignment } from '../../types/dashboard.types';

export type FeedFilter = 'all' | 'open' | 'invited' | 'in-progress';
export const FILTERS: { value: FeedFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'invited', label: 'Invited' },
  { value: 'in-progress', label: 'In progress' },
];

export function taskStatus(task: DeskAssignment, freelancerId: string): Exclude<FeedFilter, 'all'> {
  if (task.assignedToId === freelancerId && task.status === 'assigned') return 'in-progress';
  if (task.invitedIds?.includes(freelancerId) && task.status !== 'assigned') return 'invited';
  return 'open';
}

export type DeadlineState = 'overdue' | 'due-today' | 'due-soon';

export const DEADLINE_LABEL: Record<DeadlineState, string> = {
  overdue: 'Overdue',
  'due-today': 'Due today',
  'due-soon': 'Due soon',
};

/** Days of warning before a deadline counts as close */
export const DUE_SOON_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** How close assigned work is to its deadline; null when there is none or it is still far off */
export function deadlineState(deadline: Date | null | undefined, now: Date = new Date()): DeadlineState | null {
  if (!deadline) return null;
  if (deadline.getTime() < now.getTime()) return 'overdue';
  const days = Math.round((startOfDay(deadline) - startOfDay(now)) / DAY_MS);
  if (days === 0) return 'due-today';
  return days <= DUE_SOON_DAYS ? 'due-soon' : null;
}
