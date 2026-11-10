/** Types for the editor dashboard (the "Dispatch" desk) */

export type AvailabilityStatus = 'available' | 'busy' | 'off';

/** open = posted, invited = waiting on a freelancer (shown as "pending"), assigned = taken */
export type AssignmentStatus = 'open' | 'invited' | 'assigned';

export type DeskFilter = 'all' | AssignmentStatus;

export type RosterView = 'day' | 'week' | 'month';

export type ViewerRole = 'editor' | 'freelancer';

export type RateUnit = 'word' | 'hour' | 'flat';
/** Where a pitch is in the editor's review */
export type PitchStatus = 'new' | 'reviewed' | 'negotiating' | 'accepted' | 'declined';

/** The tabs above the inbox: every status, plus "all" */
export type PitchFilter = 'all' | PitchStatus;

/** A block of free time in 24h clock hours, e.g. { start: 14, end: 18 } is 2 PM to 6 PM */
export type HourWindow = { start: number; end: number };

export type RosterMember = {
  id: string;
  name: string;
  /** the headline beat shown under the name */
  specialty: string;
  /** every beat they cover, so the roster can filter on more than the headline */
  beats?: string[];
  city: string;
  /** ISO timestamp of when the editor added them to their roster */
  invitedAt?: string;
  status: AvailabilityStatus;
  openHours: HourWindow[];
  note: string;
  weekDays: boolean[];
  monthDays: boolean[];
};

export type Rate = {
  amount: number;
  unit: RateUnit;
  estimate: number;
};

export type DeskAssignment = {
  id: string;
  title: string;
  category: string;
  /** specific format, e.g. "Fact-check"; assignments posted to the database store only a category */
  type?: string;
  urgent?: boolean;
  status: AssignmentStatus;
  /** desk is optional because database posts only store a free-text contact name */
  contact: { name: string; desk?: string };
  deadline: Date | null;
  location: string;
  length: string;
  /** structured pay from the sample desk data */
  rate?: Rate;
  /** raw pay text from the database, shown when there is no structured rate */
  compensation?: string;
  interestedIds: string[];
  invitedIds?: string[];
  assignedToId?: string;
};

/** Where a pitch is in the editor's review */

/** A story idea a freelancer sends to the editor */
export type Pitch = {
  id: string;
  /** short-name used as the title, e.g. "shadow-budget-city-hall" */
  slug: string;
  category: string;
  /** extra labels shown as grey tags, e.g. ["City Hall", "Investigative feature"] */
  tags: string[];
  freelancer: { id: string; name: string };
  submittedAt: Date;
  status: PitchStatus;
  summary: string;
  location: string;
  length: string;
  deadline: string;
  rate: string;
  sources: string;
  audience: string;
  assets: string;
  whyFit: string;
  whyMe: string;
};
