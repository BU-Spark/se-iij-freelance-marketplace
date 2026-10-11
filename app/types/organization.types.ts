import { Assignment } from './assignments.types';

export type Organization = {
  id: string;
  name: string;
  bio: string;
  openAssignments: Assignment[];
  timestamp: Date;
  admins: string[]; // To Do: UUID?
  users: string[]; // To Do: UUID?
  city: string;
};
