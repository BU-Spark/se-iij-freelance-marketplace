/** Types for the editor dashboard (the "Dispatch" desk) */

export type AvailabilityStatus = 'available' | 'busy' | 'off';

/** open = posted, invited = waiting on a freelancer (shown as "pending"), assigned = taken */
export type AssignmentStatus = 'open' | 'invited' | 'assigned';

export type DeskFilter = 'all' | AssignmentStatus;

export type RosterView = 'day' | 'week' | 'month';

export type ViewerRole = 'editor' | 'freelancer';

export type RateUnit = 'word' | 'hour' | 'flat';

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
  /** RosterMember ids of freelancers who raised their hand */
  interestedIds: string[];
};
