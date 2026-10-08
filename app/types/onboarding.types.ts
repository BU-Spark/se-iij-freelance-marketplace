export type Role = 'editor' | 'freelancer';

export type Availability = 'available' | 'this-week' | 'booked';

export interface Organization {
  id: string;
  name: string;
  city: string;
}

export interface ProfileData {
  // shared
  fullName: string;
  email: string;
  bio: string;
  // editor
  title: string;
  experience: string;
  orgId: string;
  desks: string[];
  // freelancer
  location: string;
  beats: string[];
  mediums: string[];
  tools: string[];
  portfolio: string;
  availability: Availability;
}

export type ProfileErrors = Partial<Record<keyof ProfileData, string>>;
export type Step = 'role' | 'profile' | 'done';
