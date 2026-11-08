import type { AssignmentStatus } from './dashboard.types';

/** An assignment as stored in the `assignments` table */
export type Assignment = {
  id: string;
  /** Null until assignments are tied to a real organizations row */
  organizationId: string | null;
  createdByUserId: string;
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
