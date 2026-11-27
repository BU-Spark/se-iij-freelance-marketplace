import { editorUpdates, freelancerUpdates, sortUpdates, type InboxPitch } from './inbox.utils';

const pitch = (status: InboxPitch['status'], id = 'p-1'): InboxPitch => ({
  id,
  slug: 'shadow-budget',
  status,
  freelancer: { id: 'f-1', name: 'Maria Lopez' },
  submittedAt: '2026-11-20T10:00:00.000Z',
});

const NOTHING = { savedBy: [], newAssignments: [] };

describe('editorUpdates', () => {
  it('announces a received pitch, handled once the editor has opened it', () => {
    const [fresh, opened] = editorUpdates([pitch('new'), pitch('reviewed', 'p-2')], []);

    expect(fresh.title).toBe('Maria Lopez sent you a pitch: “Shadow budget”');
    expect(fresh.handled).toBe(false);
    expect(fresh.date).toEqual(new Date('2026-11-20T10:00:00.000Z'));
    expect(opened.handled).toBe(true);
  });

  it('reports an answer to a roster notice without inventing a date', () => {
    const [answer] = editorUpdates(
      [],
      [{ freelancerId: 'f-1', name: 'Devon Carter', invitedAt: '2026-11-01', response: 'declined' }]
    );

    expect(answer.title).toBe('Devon Carter declined your roster notice');
    expect(answer.href).toBe('/dashboard/roster');
    expect(answer.date).toBeUndefined();
  });
});

describe('freelancerUpdates', () => {
  it('skips pitches the editor has not touched', () => {
    expect(freelancerUpdates([pitch('new')], NOTHING)).toEqual([]);
  });

  it('gives each pitch status its own key, so a later change is unread again', () => {
    const [read] = freelancerUpdates([pitch('reviewed')], NOTHING);
    const [accepted] = freelancerUpdates([pitch('accepted')], NOTHING);

    expect(read.title).toBe('The editor read “Shadow budget”');
    expect(accepted.title).toBe('“Shadow budget” was accepted');
    expect(accepted.href).toBe('/dashboard/freelancer/pitches/p-1');
    expect(accepted.key).not.toBe(read.key);
  });

  it('lists new assignments and editors who saved this person', () => {
    const [assignment, saved] = freelancerUpdates([], {
      newAssignments: [{ id: 'a-1', title: 'School reserves', editorName: 'Jordan Reyes', postedAt: '2026-11-21' }],
      savedBy: [{ editorId: 'e-1', editorName: 'Sam Okafor', invitedAt: '2026-11-19', answered: true }],
    });

    expect(assignment.title).toBe('Jordan Reyes posted a new assignment: “School reserves”');
    expect(assignment.href).toBe('/dashboard/freelancer?assignment=a-1');
    expect(saved.title).toBe('Sam Okafor saved you to their roster');
    expect(saved.handled).toBe(true);
  });
});

describe('sortUpdates', () => {
  it('puts unread first, then undated changes, then the newest', () => {
    const item = (key: string, unread: boolean, date?: string) => ({
      key,
      unread,
      kind: 'pitch' as const,
      title: key,
      href: '/',
      date: date ? new Date(date) : undefined,
    });

    const sorted = sortUpdates([
      item('read', false, '2026-11-25'),
      item('older', true, '2026-11-01'),
      item('newer', true, '2026-11-20'),
      item('undated', true),
    ]);

    expect(sorted.map(({ key }) => key)).toEqual(['undated', 'newer', 'older', 'read']);
  });
});
