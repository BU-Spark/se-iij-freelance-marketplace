import type { PitchDraft, PitchCompensation } from '../types/pitchForm.types';
import type { PitchFeedback, PitchStatus } from '../types/dashboard.types';
import { isRecord } from './assignment.utils';

/** Every status a pitch can be in; mirrors the CHECK constraint on `pitches.status` */
export const PITCH_STATUSES: readonly PitchStatus[] = ['new', 'reviewed', 'negotiating', 'accepted', 'declined'];

export const isPitchStatus = (value: unknown): value is PitchStatus =>
  typeof value === 'string' && PITCH_STATUSES.includes(value as PitchStatus);

const DECISIONS: readonly PitchFeedback['decision'][] = ['accepted', 'rejected', 'revision_requested'];

/** True when the value is a feedback object the desk could have sent */
export function isPitchFeedback(value: unknown): value is PitchFeedback {
  if (!isRecord(value)) return false;
  return (
    DECISIONS.includes(value.decision as PitchFeedback['decision']) &&
    typeof value.comments === 'string' &&
    typeof value.strengths === 'string' &&
    typeof value.improvements === 'string'
  );
}

const asText = (value: unknown) => (typeof value === 'string' ? value : '');

/**
 * Reads a request body into a draft. Every field falls back to a blank (or default) value, so
 * `validatePitch` — the same checks the composer runs — reports what is missing.
 */
export function parsePitchDraft(body: Record<string, unknown>): PitchDraft {
  const money = isRecord(body.compensation) ? body.compensation : {};
  const { currency, unit } = money;

  return {
    title: asText(body.title),
    editorEmail: asText(body.editorEmail),
    category: asText(body.category),
    summary: asText(body.summary),
    description: asText(body.description),
    location: asText(body.location),
    length: asText(body.length),
    deadline: asText(body.deadline),
    compensation: {
      amount: asText(money.amount),
      currency: currency === 'GBP' || currency === 'EUR' ? currency : 'USD',
      unit: unit === 'word' || unit === 'hour' ? unit : 'flat',
    },
    inviteEmails: asText(body.inviteEmails),
  };
}

/** How a draft's pay reads on the pitch, e.g. "$1.10 / word" or "$650 / flat" */
export function formatPitchCompensation({ amount, currency, unit }: PitchCompensation): string {
  return `${currency} ${amount.trim()} / ${unit}`;
}

/**
 * The status each feedback decision puts the pitch in. Shared by the desk's review form and the
 * API, so the status on screen is the one stored; "request revision" lands in negotiating.
 */
export const STATUS_FOR_DECISION: Record<PitchFeedback['decision'], PitchStatus> = {
  accepted: 'accepted',
  rejected: 'declined',
  revision_requested: 'negotiating',
};

export const statusForDecision = (decision: PitchFeedback['decision']): PitchStatus => STATUS_FOR_DECISION[decision];
