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
