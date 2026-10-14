import type { DeskAssignment, RosterMember } from '../types/dashboard.types';

/* ------------------------------------------------------------------ */
/*  Temporary static data for the dashboard                            */
/*  TODO: replace with data from the backend once the API exists       */
/* ------------------------------------------------------------------ */

export const EDITOR_NAME = 'Sarah Jenkins';
export const NEW_PITCHES = 2;

/** A date `days` from today at `hour`:`minute`, so mock deadlines always look current */
const at = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
};

export const ROSTER: RosterMember[] = [
  {
    id: 'marcus',
    name: 'Marcus Thorne',
    specialty: 'Reporting',
    city: 'London',
    status: 'available',
    openHours: [{ start: 12, end: 18 }],
    note: 'Available 12:00 PM — 6:00 PM today',
  },
  {
    id: 'elena',
    name: 'Elena Rodriguez',
    specialty: 'Editing',
    city: 'New York',
    status: 'busy',
    openHours: [],
    note: 'On assignment until Friday',
  },
  {
    id: 'satoshi',
    name: 'Satoshi Tanaka',
    specialty: 'Grants',
    city: 'Tokyo',
    status: 'available',
    openHours: [{ start: 8, end: 16 }],
    note: 'Morning shift, 8 AM — 4 PM',
  },
  {
    id: 'amara',
    name: 'Amara Diallo',
    specialty: 'Audience',
    city: 'Dakar',
    status: 'available',
    openHours: [
      { start: 10, end: 14 },
      { start: 16, end: 20 },
    ],
    note: 'Flexible — most of today',
  },
  {
    id: 'jonah',
    name: 'Jonah Weiss',
    specialty: 'Reporting',
    city: 'Berlin',
    status: 'off',
    openHours: [],
    note: 'Out of office',
  },
  {
    id: 'priya',
    name: 'Priya Natarajan',
    specialty: 'Data',
    city: 'Boston',
    status: 'available',
    openHours: [{ start: 14, end: 20 }],
    note: 'Afternoons this week',
  },
];

export const ASSIGNMENTS: DeskAssignment[] = [
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
  },
];
