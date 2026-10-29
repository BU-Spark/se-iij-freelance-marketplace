import type { NewAssignment } from '../types/assignments.types';

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
