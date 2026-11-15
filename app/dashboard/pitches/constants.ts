import type { PitchStatus } from '../../types/dashboard.types';

/** How each review status reads on the desk and in the freelancer's pitch list */
export const PITCH_STATUS_LABEL: Record<PitchStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  negotiating: 'Negotiating',
  accepted: 'Accepted',
  declined: 'Declined',
};
