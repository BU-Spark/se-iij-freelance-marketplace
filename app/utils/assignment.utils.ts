import type { Assignment, NewAssignment } from '../types/assignments.types';

/** Lowercase kebab-case, e.g. "city-council-overnight" */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type AssignmentErrors = Partial<Record<keyof NewAssignment, string>>;

export const EMPTY_ASSIGNMENT: NewAssignment = {
  title: '',
  description: '',
  category: '',
  slug: '',
  contact: '',
  location: '',
  length: '',
  time: '',
  deadline: '',
  compensation: '',
};

/**
 * Field rules for a new assignment. Shared by the drawer (instant feedback)
 * and POST /api/assignments (authoritative check) so the two cannot drift.
 */
export function validateAssignment(input: NewAssignment): AssignmentErrors {
  const errors: AssignmentErrors = {};

  if (!input.title.trim()) errors.title = 'Give the assignment a title.';
  if (!input.category.trim()) errors.category = 'Pick a project type.';

  if (!input.slug.trim()) {
    errors.slug = 'Add a slug.';
  } else if (!SLUG_PATTERN.test(input.slug.trim())) {
    errors.slug = 'Use lowercase letters, numbers, and single hyphens.';
  }

  if (input.deadline && Number.isNaN(new Date(input.deadline).getTime())) {
    errors.deadline = 'Enter a valid deadline.';
  }

  return errors;
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Reads a request body defensively; anything that is not a string becomes '' */
export function parseAssignmentBody(body: Record<string, unknown>): NewAssignment {
  return {
    title: text(body.title),
    description: text(body.description),
    category: text(body.category),
    slug: text(body.slug),
    contact: text(body.contact),
    location: text(body.location),
    length: text(body.length),
    time: text(body.time),
    deadline: text(body.deadline),
    compensation: text(body.compensation),
  };
}

export const hasErrors = (errors: AssignmentErrors) => Object.keys(errors).length > 0;
/** Turns a title into a URL-safe slug: "City Council Vote!" → "city-council-vote" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (é → e)
    .replace(/[^a-z0-9]+/g, '-') // anything else becomes a dash
    .replace(/^-+|-+$/g, '') // no dashes at the start or end
    .slice(0, 60)
    .replace(/-+$/, ''); // no dash left over after cutting
}

const SEED_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Short random code, e.g. "k3x9q2" */
export function makeSeed(length = 6): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes); // fills the array with random numbers 0–255
  return Array.from(bytes, (b) => SEED_CHARS[b % SEED_CHARS.length]).join('');
}

/** Title + random seed so two assignments with the same title never clash. */
export function createSlug(title: string, seed: string = makeSeed()): string {
  const base = slugify(title) || 'assignment';
  return `${base}-${seed}`;
}
/** Keeps only a money amount: digits and one dot, max 2 decimals. "$1,2a.345" → "12.34" */
export function cleanAmount(value: string): string {
  const digits = value.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = digits.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('').slice(0, 2)}` : whole;
}

/** Compensation must be a number above 0. Returns the error message, or undefined if OK. */
export function validateCompensation(value: string): string | undefined {
  const amount = Number(value);
  if (!value.trim() || !Number.isFinite(amount) || amount <= 0) {
    return 'Enter an amount greater than $0.';
  }
  return undefined;
}

/**
 * Shows a bare amount with a currency sign: "750" → "$750". Anything else
 * (legacy free-text values such as "$800 hr") is left exactly as it was saved.
 */
export function formatCompensation(value: string): string {
  const trimmed = value.trim();
  return /^\d+(?:\.\d+)?$/.test(trimmed) ? `$${trimmed}` : trimmed;
}

/** Keeps only digits, for whole-number fields such as a word count. "1,2a00" → "1200" */
export function cleanWholeNumber(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

/**
 * Joins the separate length (words) and time (hours) fields into the single
 * `length` column, e.g. ("800", "4") → "800 words / 4 hours". A value that is
 * not a bare number (legacy free text) is kept exactly as it was sent.
 */
export function combineLengthAndTime(length: string, time: string): string {
  const isNumber = (v: string) => /^\d+(?:\.\d+)?$/.test(v);
  const withUnit = (v: string, singular: string, plural: string) =>
    isNumber(v) ? `${v} ${Number(v) === 1 ? singular : plural}` : v;

  return [withUnit(length.trim(), 'word', 'words'), withUnit(time.trim(), 'hour', 'hours')].filter(Boolean).join(' / ');
}

/**
 * The reverse of `combineLengthAndTime`, so the edit form can be filled from the saved column:
 * "800 words / 4 hours" → { length: "800", time: "4" }. Legacy free text stays in `length` untouched.
 */
export function splitLengthAndTime(combined: string): { length: string; time: string } {
  let length = '';
  let time = '';
  const leftovers: string[] = [];

  for (const part of combined
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean)) {
    const words = part.match(/^(\d+)\s+words?$/i);
    const hours = part.match(/^(\d+(?:\.\d+)?)\s+hours?$/i);
    if (words && !length) length = words[1];
    else if (hours && !time) time = hours[1];
    else leftovers.push(part);
  }

  // Anything we could not read as words/hours is kept verbatim rather than lost
  if (leftovers.length > 0) return { length: combined.trim(), time: '' };
  return { length, time };
}

/** A Date as the "YYYY-MM-DDTHH:mm" value a `datetime-local` input expects, in local time */
export function toDateTimeLocal(date: Date | null): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

/** Fills the assignment form from a saved assignment, for editing */
export function assignmentToDraft(a: Assignment): NewAssignment {
  return {
    title: a.title,
    description: a.description,
    category: a.category,
    slug: a.slug,
    contact: a.contact,
    location: a.location,
    ...splitLengthAndTime(a.length),
    deadline: toDateTimeLocal(a.deadline ? new Date(a.deadline) : null),
    compensation: a.compensation,
  };
}
