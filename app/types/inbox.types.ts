/** One line in the inbox */
export type InboxItem = {
  /** changes when the thing changes, so a new status shows up as unread again */
  key: string;
  kind: 'pitch' | 'roster' | 'assignment';
  title: string;
  href: string;
  /** left out when the app does not record when the change happened */
  date?: Date;
  /** already dealt with elsewhere, e.g. a pitch the editor has opened */
  handled?: boolean;
};

/** The updates the server reads for the header; pitches are fetched in the browser */
export type InboxSources = {
  /** recently posted open assignments, for the freelancer side */
  newAssignments: { id: string; title: string; editorName: string; postedAt: string }[];
  /** editors who saved this freelancer and chose to tell them */
  savedBy: { editorId: string; editorName: string; invitedAt: string; answered: boolean }[];
  /** freelancers who answered this editor's roster notice */
  answers: { freelancerId: string; name: string; invitedAt: string; response: 'accepted' | 'declined' }[];
};
