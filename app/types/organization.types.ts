import { Assignment } from './assignments.types';

export type Organization = {
  name: string;
  bio: string;
  openAssignments: Assignment;
  timestamp: Date;
  admins: string[];
};
