import type { VerificationRequest } from '../../types/admin.types';

// TODO: replace these sample requests with data from the backend once the verification API exists

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

export const VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'ver-1',
    name: 'Amara Okafor',
    role: 'freelancer',
    location: 'Lagos, Nigeria',
    evidence: 'Press card from the Nigerian Union of Journalists and three published clips.',
    status: 'pending',
    requestedAt: hoursAgo(3),
  },
  {
    id: 'ver-2',
    name: 'Tomás Reyes',
    role: 'editor',
    location: 'Austin, TX',
    evidence: 'Work email at the Austin Ledger and a link to the masthead.',
    status: 'pending',
    requestedAt: hoursAgo(20),
  },
  {
    id: 'ver-3',
    name: 'Hannah Becker',
    role: 'freelancer',
    location: 'Berlin, Germany',
    evidence: 'Portfolio site with bylines in two national outlets.',
    status: 'verified',
    requestedAt: hoursAgo(72),
  },
];
