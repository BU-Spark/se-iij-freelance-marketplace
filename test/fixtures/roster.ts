import type { RosterMember } from '../../app/types/dashboard.types';

/*
 * Hand-built roster members for tests only. Nothing in the app renders these: the desk, the roster
 * page and the talent directory all read real rows (see `lib/roster.ts` / `toRosterMember`), so
 * this file must never be imported from app code.
 */

/** "1101100" → [true, true, false, true, true, false, false]; spaces are ignored */
const pattern = (s: string) =>
  s
    .replace(/\s/g, '')
    .split('')
    .map((c) => c === '1');

export const SAMPLE_ROSTER: RosterMember[] = [
  {
    id: 'marcus',
    name: 'Marcus Thorne',
    specialty: 'Reporting',
    city: 'London',
    status: 'available',
    openHours: [{ start: 12, end: 18 }],
    note: 'Available 12:00 PM — 6:00 PM today',
    weekDays: pattern('1101100'),
    monthDays: pattern('1101100110 1100110110 0110110011'),
  },
  {
    id: 'elena',
    name: 'Elena Rodriguez',
    specialty: 'Editing',
    city: 'New York',
    status: 'busy',
    openHours: [],
    note: 'On assignment until Friday',
    weekDays: pattern('0000111'),
    monthDays: pattern('0000111000 0111000011 1000011110'),
  },
  {
    id: 'satoshi',
    name: 'Satoshi Tanaka',
    specialty: 'Grants',
    city: 'Tokyo',
    status: 'available',
    openHours: [{ start: 8, end: 16 }],
    note: 'Morning shift, 8 AM — 4 PM',
    weekDays: pattern('1111100'),
    monthDays: pattern('1111100111 1100111110 0111110011'),
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
    weekDays: pattern('1111110'),
    monthDays: pattern('1111110111 1110111111 0111111011'),
  },
  {
    id: 'jonah',
    name: 'Jonah Weiss',
    specialty: 'Reporting',
    city: 'Berlin',
    status: 'off',
    openHours: [],
    note: 'Out of office',
    weekDays: pattern('0000000'),
    monthDays: pattern('0000000000 0000000000 0000000000'),
  },
  {
    id: 'priya',
    name: 'Priya Natarajan',
    specialty: 'Data',
    city: 'Boston',
    status: 'available',
    openHours: [{ start: 14, end: 20 }],
    note: 'Afternoons this week',
    weekDays: pattern('1010101'),
    monthDays: pattern('1010101010 0101010101 1010101010'),
  },
];
