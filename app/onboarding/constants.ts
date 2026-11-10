import type { Weekday } from '../types/availability.types';
import type { RateUnit } from '../types/dashboard.types';
import type { OrgOption, ProfileData } from '../types/onboarding.types';
import type { UserPreferences } from '../types/user.types';

/* ------------------------------------------------------------------ */
/*  Temporary static data for onboarding                               */
/*  TODO: replace with data from the backend once the API exists       */
/* ------------------------------------------------------------------ */

export const DEFAULT_ORGS: OrgOption[] = [
  { id: 'meridian', name: 'The Meridian Post', city: 'New York' },
  { id: 'crosswind', name: 'Crosswind Weekly', city: 'Berlin' },
  { id: 'signal', name: 'Signal Room', city: 'Remote' },
  { id: 'broadsheet', name: 'Broadsheet Pacific', city: 'Tokyo' },
];

export const TOPICS = [
  'Politics',
  'Business',
  'Climate',
  'Tech',
  'Culture',
  'Health',
  'Local',
  'World',
  'Sports',
  'Investigations',
];

/** The chip that unlocks the free-text "Your beat" field */
export const BEAT_OTHER = 'Other/Not listed here';

/** The beats a freelancer can cover; kept in the same order the desk uses when planning */
export const BEATS = [
  'Politics',
  'Government Accountability',
  'Law/Legal Issues',
  'Foreign Policy',
  'National Security',
  'Military',
  'Policy',
  'Finance/Economics',
  'Tech',
  'Business',
  'Personal Finance',
  'Real Estate',
  'Careers',
  'Labor/Workers Rights',
  'Culture',
  'Internet Culture',
  'Media/Power',
  'Entertainment/Hollywood',
  'Music',
  'Film/Movies',
  'Books/Writing',
  'Art',
  'History',
  'Comedy',
  'Design',
  'Photography',
  'Games/Gaming',
  'Architecture',
  'Museums',
  'Climate/Environment',
  'Health/Wellness',
  'Science',
  'Energy',
  'Mental Health',
  'Cancer',
  'Weather',
  'Food',
  'Travel',
  'Lifestyle',
  'Fashion',
  'Fitness',
  'Parenting',
  'Home',
  'Restaurants and bars',
  'Recipes',
  'Sports',
  'Outdoors',
  'Dating/Romance',
  'Things to do',
  'Self-Help',
  'Beauty',
  'Local',
  'Education',
  'Housing',
  'Urban Planning',
  'Transportation',
  'Crime',
  'Construction',
  'Agriculture',
  'LGBTQIA',
  'Identity/Belonging',
  'Gender',
  'Immigration',
  'Human Rights',
  'Criminal Justice',
  'Faith/Religion',
  'Activism',
  'Inequality',
  'General News',
  BEAT_OTHER,
];

/** The craft a freelancer brings, independent of the beat they cover */
export const SKILLS = [
  'Explanatory Journalism',
  'Investigative Journalism',
  'Data Visualization',
  'Solutions Journalism',
  'Day in a life',
  'Photojournalism',
  'Audio Reporting',
  'Visual/Video Journalism',
  'Audience Strategy',
  'Print/digital writing',
];

export const MEDIUMS = ['Text', 'Photo', 'Video', 'Audio', 'Data', 'Illustration'];

/** How an editor likes to receive pitches */
export const PITCH_FORMATS = ['Email pitch', 'Pitch form', 'Shared doc', 'Any format'];

export const THEMES: { id: UserPreferences['theme']; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export const LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'German', 'Mandarin', 'Arabic', 'Other'];

export const RATE_UNITS: { id: RateUnit; label: string }[] = [
  { id: 'word', label: 'Per word' },
  { id: 'hour', label: 'Per hour' },
  { id: 'flat', label: 'Flat rate' },
];

export const WEEKDAYS: { id: Weekday; label: string; short: string }[] = [
  { id: 'monday', label: 'Monday', short: 'Mon' },
  { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { id: 'thursday', label: 'Thursday', short: 'Thu' },
  { id: 'friday', label: 'Friday', short: 'Fri' },
  { id: 'saturday', label: 'Saturday', short: 'Sat' },
  { id: 'sunday', label: 'Sunday', short: 'Sun' },
];

// Each chip gets a logo color, cycling through the fan
export const CHIP_COLORS = [
  'var(--c-green)',
  'var(--c-amber)',
  'var(--c-red)',
  'var(--c-purple)',
  'var(--c-sky)',
  'var(--c-blue)',
  'var(--c-yellow)',
  'var(--c-pink)',
  'var(--c-green-d)',
  'var(--c-orange)',
];

export const EMPTY: ProfileData = {
  firstName: '',
  lastName: '',
  email: '',
  businessEmailVerified: false,
  dateOfBirth: '',
  shortBio: '',
  longBio: '',
  photoKey: '',
  photoUrl: '',
  theme: 'system',
  emailNotifications: true,
  pushNotifications: false,
  language: 'English',
  jobTitle: '',
  yearsAtDesk: 0,
  organizationId: 'meridian',
  desks: [],
  preferredPitchFormat: '',
  averageResponseTime: 0,
  interestedTopics: [],
  editorialPreferences: [],
  lookingFor: [],
  location: '',
  reportingBeats: [],
  beatOther: '',
  skills: [],
  workMediums: [],
  tools: [],
  portfolio: [],
  rateAmount: '',
  rateUnit: 'word',
  communityCovered: '',
  beatTags: [],
  availableDays: [],
  workdayStart: '09:00',
  workdayEnd: '17:00',
  timezone: '',
};
