import type { Pitch } from '../../types/dashboard.types';

/** One labelled piece of a pitch, e.g. { label: 'Compensation', key: 'rate' } */
export type PitchField = {
  label: string;
  key: keyof Pitch;
};

/** The quick facts shown in the grey box, in the same order as an assignment's */
export const PITCH_FACTS: PitchField[] = [
  { label: 'Deadline', key: 'deadline' },
  { label: 'Location', key: 'location' },
  { label: 'Length', key: 'length' },
  { label: 'Compensation', key: 'rate' },
];
