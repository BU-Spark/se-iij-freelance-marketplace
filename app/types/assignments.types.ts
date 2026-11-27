import type { AssignmentStatus } from './dashboard.types';

/** An assignment as stored in the `assignments` table */
export type Assignment = {
  id: string;
  /** Null until assignments are tied to a real organizations row */
  organizationId: string | null;
  createdByUserId: string;
  /** The editor who posted it; resolved from users so the organization view can name them */
  createdByName?: string;
  title: string;
  description: string;
  category: string;
  slug: string;
  contact: string;
  location: string;
  length: string;
  deadline: Date | null;
  compensation: string;
  status: AssignmentStatus;
  /** the freelancer who took it on, once an editor assigned someone; absent on older fixtures */
  assignedToUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** What the New Assignment form submits and `POST /api/assignments` accepts */
export type NewAssignment = {
  title: string;
  description: string;
  category: string;
  slug: string;
  contact: string;
  location: string;
  /** Word count as a whole number, e.g. "800", or '' when left blank */
  length: string;
  /** Hours of work as a number, e.g. "4" or "1.5", or '' when left blank */
  time: string;
  /** ISO 8601 timestamp from a `datetime-local` input, or '' when left blank */
  deadline: string;
  compensation: string;
};

/** How a freelancer answered an assignment; `at` is when the server saved it (ISO 8601) */
export type AssignmentResponse =
  | { kind: 'interested'; at: string }
  | { kind: 'declined'; reasons: string[]; note: string; at: string }
  | { kind: 'negotiating'; proposal: string; at: string };

/** Everything one freelancer has answered, keyed by assignment id */
export type AssignmentResponses = Record<string, AssignmentResponse>;

/** What the freelancer sends; the server stamps the time */
export type AssignmentResponseInput =
  | { kind: 'interested' }
  | { kind: 'declined'; reasons: string[]; note?: string }
  | { kind: 'negotiating'; proposal: string };
