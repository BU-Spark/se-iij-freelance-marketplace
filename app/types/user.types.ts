/**
 * user.types.ts
 *
 * This directory (app/types/) is intended for shared TypeScript type definitions and interfaces
 * that might be used across different parts of the application.
 * For example, you might define shapes for API responses, data models, or complex prop types.
 *
 * This file defines a simple User interface.
 */

import type { Availability } from './availability.types';
import { Badge } from './badges.types';
import type { PortfolioItem } from './portfolioItem.types';
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
  shortBio?: string;
  longBio?: string;
  /** S3 object key for the profile photo; the bucket is private, so URLs are signed on read */
  photoKey?: string;
  preferences?: UserPreferences;
}

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  EDITOR = 'EDITOR',
  FREELANCER = 'FREELANCER',
}

export interface Editor {
  user: User;
  location?: string;
  organizationId?: string;
  availability?: Availability;
  desks: string[];
  pitchPreferences: PitchPreferences;
  jobTitle: string;
  yearsAtDesk: number;
}

export interface Freelancer {
  user: User;
  location?: string;
  rate?: string;
  communityCovered?: string;
  reportingBeats?: string[];
  beatTags?: string[]; //todo: Expand into its own type
  workMediums?: string[];
  tools?: string[];
  portfolio?: PortfolioItem[];
  availability?: Availability;
}

export interface PitchPreferences {
  preferredPitchFormat: string;
  averageResponseTime: number;
  interestedTopics: string[];
  editorialPreferences: string[];
  lookingFor: string[];
}

export type UserProfile = Editor | Freelancer;

// Example of a more complex type that might use the User interface
export interface UserProfilePageData {
  user: UserProfile;
  recentActivity: ActivityLog[];
  preferences: UserPreferences;
  badges: Badge[];
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: string;
  details?: Record<string, unknown>;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
  };
  language: string;
}
