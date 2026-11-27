import type { Pitch, PitchStatus } from '../types/dashboard.types';
import type { InboxItem, InboxSources } from '../types/inbox.types';
import { assignmentDrawerHref } from './dashboard.utils';
import { pitchHeading } from './pitch.utils';

/** A pitch as `/api/pitches` sends it, with the date still a string */
export type InboxPitch = Pick<Pitch, 'id' | 'slug' | 'status' | 'freelancer'> & { submittedAt: string };

/** What a freelancer reads when their pitch moves; a `new` pitch is not news to its author */
const STATUS_TITLES: Partial<Record<PitchStatus, (title: string) => string>> = {
  reviewed: (title) => `The editor read ${title}`,
  negotiating: (title) => `The editor proposed changes to ${title}`,
  accepted: (title) => `${title} was accepted`,
  declined: (title) => `${title} was declined`,
};

const quoted = (slug: string) => `“${pitchHeading(slug)}”`;

export function editorUpdates(pitches: InboxPitch[], answers: InboxSources['answers']): InboxItem[] {
  return [
    ...pitches.map(
      (pitch): InboxItem => ({
        key: `pitch:${pitch.id}:received`,
        kind: 'pitch',
        title: `${pitch.freelancer.name} sent you a pitch: ${quoted(pitch.slug)}`,
        href: '/dashboard/pitches',
        date: new Date(pitch.submittedAt),
        handled: pitch.status !== 'new',
      })
    ),
    ...answers.map(
      (answer): InboxItem => ({
        key: `answer:${answer.freelancerId}:${answer.response}:${answer.invitedAt}`,
        kind: 'roster',
        title: `${answer.name} ${answer.response} your roster notice`,
        href: '/dashboard/roster',
      })
    ),
  ];
}

export function freelancerUpdates(
  pitches: InboxPitch[],
  { savedBy, newAssignments }: Pick<InboxSources, 'savedBy' | 'newAssignments'>
): InboxItem[] {
  return [
    ...newAssignments.map(
      (assignment): InboxItem => ({
        key: `assignment:${assignment.id}`,
        kind: 'assignment',
        title: `${assignment.editorName} posted a new assignment: “${assignment.title}”`,
        href: assignmentDrawerHref('/dashboard/freelancer', assignment.id),
        date: new Date(assignment.postedAt),
      })
    ),
    ...pitches.flatMap((pitch): InboxItem[] => {
      const title = STATUS_TITLES[pitch.status]?.(quoted(pitch.slug));
      if (!title) return [];
      return [
        {
          key: `pitch:${pitch.id}:${pitch.status}`,
          kind: 'pitch',
          title,
          href: `/dashboard/freelancer/pitches/${pitch.id}`,
        },
      ];
    }),
    ...savedBy.map(
      (save): InboxItem => ({
        key: `saved:${save.editorId}:${save.invitedAt}`,
        kind: 'roster',
        title: `${save.editorName} saved you to their roster`,
        href: '/dashboard/freelancer',
        date: new Date(save.invitedAt),
        handled: save.answered,
      })
    ),
  ];
}

/** Unread first, then newest; undated changes go ahead of dated ones */
export function sortUpdates<T extends InboxItem & { unread: boolean }>(items: T[]): T[] {
  const when = (item: T) => item.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return [...items].sort((a, b) => Number(b.unread) - Number(a.unread) || when(b) - when(a));
}
