export const MAX_SAMPLES = 3;
export const MAX_NOTE = 1000;

/** What a freelancer fills in to apply */
export type ApplicationDraft = {
  note: string;
  /** links to published work; always at least one box, even when empty */
  samples: string[];
  rateChoice: 'listed' | 'other';
  /** their own rate, used when the listed pay doesn't suit them or none was listed */
  rate: string;
  meetsDeadline: boolean;
};

export type ApplicationErrors = {
  note?: string;
  /** one entry per sample box */
  samples?: (string | undefined)[];
  rate?: string;
  meetsDeadline?: string;
};

export const emptyDraft = (samples: string[] = []): ApplicationDraft => ({
  note: '',
  samples: samples.length ? [...samples] : [''],
  rateChoice: 'listed',
  rate: '',
  meetsDeadline: false,
});

/** "example.com/story" → "https://example.com/story"; null when it isn't a web address */
export function toWebAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

export function validateApplication(draft: ApplicationDraft, needs: { deadline: boolean }): ApplicationErrors {
  const errors: ApplicationErrors = {};

  if (!draft.note.trim()) errors.note = 'Tell the editor why you are a good fit.';

  const hasSample = draft.samples.some((sample) => sample.trim());
  const samples = draft.samples.map((sample, index) => {
    if (!sample.trim()) return !hasSample && index === 0 ? 'Add at least one link to your work.' : undefined;
    return toWebAddress(sample) ? undefined : 'Enter a web address, like example.com/my-story.';
  });
  if (samples.some(Boolean)) errors.samples = samples;

  if (draft.rateChoice === 'other' && !draft.rate.trim()) errors.rate = 'Enter the rate you want.';
  if (needs.deadline && !draft.meetsDeadline) errors.meetsDeadline = 'Confirm you can meet the deadline.';

  return errors;
}
