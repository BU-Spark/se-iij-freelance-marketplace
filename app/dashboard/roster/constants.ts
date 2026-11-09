import type { RosterMember } from '../../types/dashboard.types';
import { ROSTER } from '../constants';

/* ------------------------------------------------------------------ */
/*  Temporary static data for the roster page                          */
/*  TODO: replace with the editor's real roster once the API exists    */
/* ------------------------------------------------------------------ */

/** An ISO date `days` ago, so "Added …" always looks recent */
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

/** Beats the dashboard sample data doesn't carry, keyed by member id */
const EXTRA: Record<string, Pick<RosterMember, 'beats'>> = {
  marcus: { beats: ['Reporting', 'Politics', 'City Hall'] },
  elena: { beats: ['Editing', 'Features'] },
  satoshi: { beats: ['Grants', 'Science'] },
  amara: { beats: ['Audience', 'Culture'] },
  jonah: { beats: ['Reporting', 'Housing'] },
  priya: { beats: ['Data', 'Health'] },
};

/** Who this editor has already invited, and how many days ago */
const INVITED_DAYS_AGO: Record<string, number> = { marcus: 30, elena: 12, amara: 3, jonah: 1 };

const withExtras = (member: RosterMember): RosterMember => ({ ...member, ...EXTRA[member.id] });

/** Freelancers on the editor's roster */
export const ROSTER_MEMBERS: RosterMember[] = ROSTER.filter((m) => m.id in INVITED_DAYS_AGO).map((m) => ({
  ...withExtras(m),
  invitedAt: daysAgo(INVITED_DAYS_AGO[m.id]),
}));

/** Everyone else in the directory, who can still be invited */
export const ROSTER_INVITABLE: RosterMember[] = ROSTER.filter((m) => !(m.id in INVITED_DAYS_AGO)).map(withExtras);
