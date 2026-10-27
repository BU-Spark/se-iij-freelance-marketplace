import type { Pitch } from '../../types/dashboard.types';

/** One labelled piece of a pitch, e.g. { label: 'Rate', key: 'rate' } */
export type PitchField = {
  label: string;
  key: keyof Pitch;
};

/** The four quick facts shown in the grey box */
export const PITCH_FACTS: PitchField[] = [
  { label: 'Location', key: 'location' },
  { label: 'Length', key: 'length' },
  { label: 'Deadline', key: 'deadline' },
  { label: 'Rate', key: 'rate' },
];

/** The longer answers, shown one under another */
export const PITCH_SECTIONS: PitchField[] = [
  { label: 'Potential sources', key: 'sources' },
  { label: 'Audience', key: 'audience' },
  { label: 'Assets', key: 'assets' },
  { label: "Why it's a fit for the publication", key: 'whyFit' },
  { label: "Why they're the right person", key: 'whyMe' },
];
