export type PitchCompensation = {
  amount: string;
  currency: 'USD' | 'GBP' | 'EUR';
  unit: 'flat' | 'word' | 'hour';
};

/** Editable pitch payload; recipients and collaborators are not sent until API integration. */
export type PitchDraft = {
  title: string;
  editorEmail: string;
  category: string;
  summary: string;
  description: string;
  location: string;
  length: string;
  deadline: string;
  compensation: PitchCompensation;
  inviteEmails: string;
};
export type PitchFormErrors = Partial<Record<keyof PitchDraft, string>>;
