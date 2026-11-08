/** What a flag points at: a person's account or something they posted */
export type FlagTarget = 'account' | 'assignment' | 'pitch';

/** Where a flag sits in the Story Match team's queue */
export type FlagStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

/** One report in the admin inbox, raised when someone taps the flag icon */
export type FlagReport = {
  id: string;
  targetType: FlagTarget;
  targetId: string;
  /** short human label for the flagged thing, e.g. a name or headline */
  targetLabel: string;
  reason: string;
  reporterName: string;
  status: FlagStatus;
  /** ISO timestamp */
  createdAt: string;
};

/** Where a freelancer or editor sits in identity verification */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/** Whether an account can sign in and use the marketplace */
export type AccountStatus = 'active' | 'suspended';
