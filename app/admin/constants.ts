import type { FlagReport } from '../types/admin.types';

// TODO: replace these sample flags with data from the backend once the flags API exists

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const FLAG_REPORTS: FlagReport[] = [
  {
    id: 'flag-1',
    targetType: 'pitch',
    targetId: 'shadow-budget',
    targetLabel: 'The shadow budget at City Hall',
    reason: 'Claims look copied from another outlet’s published story.',
    reporterName: 'Dana Whitfield',
    status: 'open',
    createdAt: hoursAgo(2),
  },
  {
    id: 'flag-2',
    targetType: 'account',
    targetId: 'user-jlee',
    targetLabel: 'Jordan Lee',
    reason: 'Profile photo and portfolio belong to a different reporter.',
    reporterName: 'Marcus Thorne',
    status: 'open',
    createdAt: hoursAgo(7),
  },
  {
    id: 'flag-3',
    targetType: 'assignment',
    targetId: 'transit-strike',
    targetLabel: 'Transit strike explainer',
    reason: 'Rate listed is far below the posted minimum.',
    reporterName: 'Priya Shah',
    status: 'reviewing',
    createdAt: hoursAgo(26),
  },
];
