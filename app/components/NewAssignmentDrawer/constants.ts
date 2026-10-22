import type { NewAssignmentDraft } from '../../types/dashboard.types';

// TODO: confirm the final list with the team
export const PROJECT_TYPES = [
  'Reporting/Writing',
  'Editing',
  'Audience Engagement',
  'Grant/Sponsorship Proposals',
  'Visuals',
];

/** A blank form */
export const EMPTY_DRAFT: NewAssignmentDraft = {
  category: '',
  slug: '',
  contact: '',
  location: '',
  length: '',
  deadline: '',
  compensation: '',
  description: '',
};
