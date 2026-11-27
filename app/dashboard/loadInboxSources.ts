import { listOpenAssignments, loadAssignmentViewer } from '../../lib/assignments';
import { listInvitesForFreelancer, loadEditorRoster } from '../../lib/roster';
import type { ProfileRole } from '../types/profile.types';
import type { InboxSources } from '../types/inbox.types';

/** How long a posted assignment counts as news */
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** The same open assignments the freelancer dashboard lists, limited to recent ones by other people */
async function loadNewAssignments(clerkId: string): Promise<InboxSources['newAssignments']> {
  const viewer = await loadAssignmentViewer(clerkId);
  const since = Date.now() - NEW_FOR_MS;

  return (await listOpenAssignments(viewer))
    .filter((post) => post.createdAt.getTime() >= since && post.createdByUserId !== viewer?.userId)
    .map((post) => ({
      id: post.id,
      title: post.title,
      editorName: post.createdByName || 'An editor',
      postedAt: post.createdAt.toISOString(),
    }));
}

async function loadSavedBy(clerkId: string): Promise<InboxSources['savedBy']> {
  return (await listInvitesForFreelancer(clerkId)).map((invite) => ({
    editorId: invite.editorId,
    editorName: invite.editorName,
    invitedAt: invite.invitedAt,
    answered: invite.status !== 'pending',
  }));
}

async function loadAnswers(clerkId: string): Promise<InboxSources['answers']> {
  const { members } = await loadEditorRoster(clerkId);

  return members.flatMap(({ id, name, notified, inviteStatus, invitedAt = '' }) =>
    notified && inviteStatus && inviteStatus !== 'pending'
      ? [{ freelancerId: id, name, invitedAt, response: inviteStatus }]
      : []
  );
}

/** A failed read leaves that part of the inbox empty rather than blocking the page */
const orEmpty = <T>(load: Promise<T[]>): Promise<T[]> =>
  load.catch((error) => {
    console.error('Could not load updates for the inbox.', error);
    return [];
  });

/** The inbox updates read on the server, for whichever sides of the desk this person has */
export async function loadInboxSources(clerkId: string, roles: ProfileRole[]): Promise<InboxSources> {
  const freelancer = roles.includes('freelancer');

  const [newAssignments, savedBy, answers] = await Promise.all([
    freelancer ? orEmpty(loadNewAssignments(clerkId)) : [],
    freelancer ? orEmpty(loadSavedBy(clerkId)) : [],
    roles.includes('editor') ? orEmpty(loadAnswers(clerkId)) : [],
  ]);

  return { newAssignments, savedBy, answers };
}
