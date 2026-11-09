import type { AdminAccount } from '../../types/admin.types';

// TODO: replace these sample accounts with data from the backend once the accounts API exists

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'acc-1',
    name: 'Amara Okafor',
    email: 'amara@example.com',
    role: 'freelancer',
    status: 'active',
    joinedAt: '2026-09-14T10:00:00Z',
  },
  {
    id: 'acc-2',
    name: 'Tomás Reyes',
    email: 'tomas@example.com',
    role: 'editor',
    status: 'active',
    joinedAt: '2026-10-02T10:00:00Z',
  },
  {
    id: 'acc-3',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    role: 'freelancer',
    status: 'suspended',
    suspensionReason: 'Portfolio used another reporter’s published work.',
    joinedAt: '2026-08-21T10:00:00Z',
  },
];
