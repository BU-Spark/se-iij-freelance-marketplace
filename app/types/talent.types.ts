import type { RosterMember } from './dashboard.types';

export type TalentFilters = {
  q?: string;
  beat?: string;
  medium?: string;
  location?: string;
  availableNow?: boolean;
};

export type TalentClip = { title: string; url: string; type?: string; description?: string };

export type TalentProfile = {
  shortBio: string;
  longBio: string;
  communityCovered: string;
  rate: string;
  tools: string[];
  portfolio: TalentClip[];
};

export type TalentMember = RosterMember & {
  mediums: string[];
  availableNow: boolean;
  profile: TalentProfile;
};

export type TalentFilterOptions = { beats: string[]; mediums: string[]; locations: string[] };
