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

/** Someone who asked the Story Match team to verify who they are */
export type VerificationRequest = {
  id: string;
  name: string;
  role: 'freelancer' | 'editor';
  location: string;
  /** what they sent as proof, e.g. a press card or published clips */
  evidence: string;
  status: Exclude<VerificationStatus, 'unverified'>;
  /** ISO timestamp */
  requestedAt: string;
};

/** One beat the team offers to freelancers during onboarding */
export type Beat = {
  id: string;
  name: string;
  /** Where it sits in the onboarding picker; lower comes first */
  sortOrder: number;
};

/** One person's account as the Story Match team sees it on the Accounts tab */
export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: 'freelancer' | 'editor';
  status: AccountStatus;
  /** why the team suspended them; only set while suspended */
  suspensionReason?: string;
  /** ISO timestamp */
  joinedAt: string;
};
