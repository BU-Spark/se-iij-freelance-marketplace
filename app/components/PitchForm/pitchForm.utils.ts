import type { PitchDraft, PitchFormErrors } from '../../types/pitchForm.types';
import { isValidEmail } from '../../utils/validation.utils';

export const EMPTY_PITCH: PitchDraft = {
  title: '',
  editorEmail: '',
  category: '',
  summary: '',
  description: '',
  location: '',
  length: '',
  deadline: '',
  compensation: { amount: '', currency: 'USD', unit: 'flat' },
  inviteEmails: '',
};

export function pitchSlug(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

export function pitchInviteEmails(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,;\n]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function validatePitch(draft: PitchDraft, today = localToday()): PitchFormErrors {
  const errors: PitchFormErrors = {};
  if (!draft.title.trim() || !pitchSlug(draft.title)) errors.title = 'Enter a title containing letters or numbers.';
  if (!isValidEmail(draft.editorEmail.trim())) errors.editorEmail = 'Enter the recipient editor’s email.';
  if (!draft.category) errors.category = 'Choose a category.';
  if (!draft.summary.trim()) errors.summary = 'Add a short summary.';
  if (!draft.description.trim()) errors.description = 'Describe your angle, reporting plan, and sources.';
  if (!draft.location.trim()) errors.location = 'Enter a location or Remote.';
  if (!draft.length.trim()) errors.length = 'Enter the proposed length or duration.';
  if (!draft.deadline || draft.deadline < today) errors.deadline = 'Choose a delivery date today or later.';
  if (
    !draft.compensation.amount.trim() ||
    !Number.isFinite(Number(draft.compensation.amount)) ||
    Number(draft.compensation.amount) <= 0
  )
    errors.compensation = 'Enter a compensation amount greater than zero.';
  if (pitchInviteEmails(draft.inviteEmails).some((email) => !isValidEmail(email)))
    errors.inviteEmails = 'Enter valid collaborator emails separated by commas.';
  return errors;
}

export function isPitchDraft(value: unknown): value is PitchDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  const fields = [
    'title',
    'editorEmail',
    'category',
    'summary',
    'description',
    'location',
    'length',
    'deadline',
    'inviteEmails',
  ];
  if (
    !fields.every((key) => typeof draft[key] === 'string') ||
    !draft.compensation ||
    typeof draft.compensation !== 'object'
  )
    return false;
  const pay = draft.compensation as Record<string, unknown>;
  return (
    typeof pay.amount === 'string' &&
    ['USD', 'GBP', 'EUR'].includes(String(pay.currency)) &&
    ['flat', 'word', 'hour'].includes(String(pay.unit))
  );
}
