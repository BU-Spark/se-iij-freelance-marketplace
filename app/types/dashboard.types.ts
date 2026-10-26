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
  specialty: string;
  city: string;
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
  type: string;
  urgent?: boolean;
  status: AssignmentStatus;
  contact: { name: string; desk: string };
  deadline: Date;
  location: string;
  length: string;
  rate: Rate;
  interestedIds: string[];
  invitedIds?: string[];
  assignedToId?: string;
};

/** What the editor types into the New Assignment form (all text for now) */
export type NewAssignmentDraft = {
  category: string;
  slug: string;
  contact: string;
  location: string;
  length: string;
  deadline: string;
  compensation: string;
  description: string;
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
