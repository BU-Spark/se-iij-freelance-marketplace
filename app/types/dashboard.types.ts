/** Types for the editor dashboard (the "Dispatch" desk) */

import type { AssignmentStatus } from './assignments.types';

export type { AssignmentStatus };

export type AvailabilityStatus = 'available' | 'busy' | 'off';

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
