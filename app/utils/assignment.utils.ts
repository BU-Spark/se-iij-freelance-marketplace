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
