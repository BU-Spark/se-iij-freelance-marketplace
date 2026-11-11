import type { DeskAssignment } from '../../app/types/dashboard.types';

/**
 * Assignment fixtures for component tests.
 *
 * The dashboard used to render these as sample cards; it now reads every assignment from the
 * database, so the data lives here instead and only tests use it.
 */

/** A date `days` from today at `hour`:`minute`, so fixture deadlines always look current */
const at = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const SAMPLE_ASSIGNMENTS: DeskAssignment[] = [
  {
    id: 'election-d4',
    title: 'Election Night Live Coverage: District 4',
    category: 'Reporting/Writing',
    type: 'Reporting',
    urgent: true,
    status: 'open',
    contact: { name: 'Sarah Jenkins', desk: 'News Desk' },
    deadline: at(0, 23),
    location: 'Central City Hall',
    length: '~ 6 hours',
    rate: { amount: 1.1, unit: 'word', estimate: 1100 },
    interestedIds: ['marcus', 'satoshi', 'amara'],
    invitedIds: ['marcus', 'satoshi', 'amara', 'jonah'],
  },
  {
    id: 'port-oped',
    title: 'Op-Ed Review: Port Authority expansion',
    category: 'Editing',
    type: 'Editing',
    status: 'open',
    contact: { name: 'David Park', desk: 'Opinion' },
    deadline: at(2, 17),
    location: 'Remote',
    length: '3–4 hours',
    rate: { amount: 85, unit: 'hour', estimate: 300 },
    interestedIds: [],
    invitedIds: ['elena'],
  },
  {
    id: 'harbor-market',
    title: 'Photo Essay: Harbor Night Market',
    category: 'Photo',
    type: 'Photography',
    status: 'invited',
    contact: { name: 'Lena Brooks', desk: 'Features' },
    deadline: at(4, 12),
    location: 'Pier 9',
    length: '1 evening',
    rate: { amount: 450, unit: 'flat', estimate: 450 },
    interestedIds: ['amara'],
  },
  {
    id: 'transit-data',
    title: 'Data Check: Transit ridership numbers',
    category: 'Data',
    type: 'Fact-check',
    status: 'assigned',
    contact: { name: 'Sarah Jenkins', desk: 'News Desk' },
    deadline: at(1, 10),
    location: 'Remote',
    length: '2 hours',
    rate: { amount: 70, unit: 'hour', estimate: 140 },
    interestedIds: ['priya'],
    assignedToId: 'priya',
  },
];
