import { EMPTY } from '../onboarding/constants';
import type { ProfileData } from '../types/onboarding.types';
import { Role } from '../types/user.types';
import { formatRate, summarizeAvailability, toEditor, toFreelancer, toProfile } from './profile.utils';

const base: ProfileData = { ...EMPTY, firstName: ' Sarah ', lastName: 'Jenkins', email: 'sarah@newsroom.example' };

const preferences = {
  theme: 'system',
  language: 'English',
  notifications: { email: true, push: false },
};

describe('profile mappers', () => {
  it('maps editor form data onto the Editor type', () => {
    const editor = toEditor({ ...base, jobTitle: 'News Editor', yearsAtDesk: 4, desks: ['Politics'] });

    expect(editor).toMatchObject({
      organizationId: 'meridian',
      jobTitle: 'News Editor',
      yearsAtDesk: 4,
      desks: ['Politics'],
    });
    expect(editor.location).toBeUndefined();
    expect(editor.availability).toBeUndefined();
  });

  it('maps freelancer form data onto the Freelancer type', () => {
    const portfolio = [{ id: 'portfolio-link', type: 'article' as const, title: 'Portfolio', url: 'https://a.co' }];
    const freelancer = toFreelancer({
      ...base,
      reportingBeats: ['Climate'],
      workMediums: ['Photo'],
      portfolio,
    });

    expect(freelancer).toMatchObject({ reportingBeats: ['Climate'], workMediums: ['Photo'], portfolio });
    expect(freelancer.location).toBeUndefined();
    expect(freelancer.rate).toBeUndefined();
    expect(freelancer.communityCovered).toBeUndefined();
  });

  it('sends only the record for the selected role', () => {
    const editorOnly = toProfile(['editor'], base);

    expect(editorOnly.roles).toEqual(['editor']);
    expect(editorOnly.editor).toBeDefined();
    expect(editorOnly.freelancer).toBeUndefined();

    const freelancerOnly = toProfile(['freelancer'], base);

    expect(freelancerOnly.roles).toEqual(['freelancer']);
    expect(freelancerOnly.editor).toBeUndefined();
    expect(freelancerOnly.freelancer).toBeDefined();
  });

  it('sends both records when the user works both sides', () => {
    const both = toProfile(['editor', 'freelancer'], base);

    expect(both.roles).toEqual(['editor', 'freelancer']);
    expect(both.editor).toBeDefined();
    expect(both.freelancer).toBeDefined();
    expect(both.user.roles).toEqual([Role.EDITOR, Role.FREELANCER]);
  });

  it('keeps the shared user fields on a single record', () => {
    const { user } = toProfile(['editor', 'freelancer'], { ...base, shortBio: ' Climate reporter ' });

    expect(user).toEqual({
      email: 'sarah@newsroom.example',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      shortBio: 'Climate reporter',
      longBio: undefined,
      preferences,
      roles: [Role.EDITOR, Role.FREELANCER],
    });
  });

  it('collects the editor pitch preferences and availability', () => {
    const editor = toEditor({
      ...base,
      longBio: ' I commission accountability work. ',
      preferredPitchFormat: 'Email pitch',
      averageResponseTime: 4,
      interestedTopics: ['Investigations'],
      editorialPreferences: ['Long-form only'],
      lookingFor: ['Accountability reporting'],
      availableDays: ['monday', 'friday'],
      workdayStart: '10:00',
      workdayEnd: '18:00',
      timezone: 'America/New_York',
      location: ' Chicago, IL ',
    });

    expect(editor.location).toBe('Chicago, IL');
    expect(editor.pitchPreferences).toEqual({
      preferredPitchFormat: 'Email pitch',
      averageResponseTime: 4,
      interestedTopics: ['Investigations'],
      editorialPreferences: ['Long-form only'],
      lookingFor: ['Accountability reporting'],
    });
    expect(editor.availability).toMatchObject({
      source: 'manual',
      timezone: 'America/New_York',
      days: ['monday', 'friday'],
      typicalWorkingWindow: { startsAt: '10:00', endsAt: '18:00' },
    });
  });

  it('collects the freelancer rate, coverage and beat tags', () => {
    const freelancer = toFreelancer({
      ...base,
      rateAmount: '0.75',
      rateUnit: 'word',
      communityCovered: ' South Texas ',
      beatTags: ['Housing'],
    });

    expect(freelancer.rate).toBe('$0.75 / word');
    expect(freelancer.communityCovered).toBe('South Texas');
    expect(freelancer.beatTags).toEqual(['Housing']);
  });

  it('stores the notification and display preferences on the user', () => {
    const { user } = toProfile(['freelancer'], {
      ...base,
      theme: 'dark',
      language: 'Spanish',
      emailNotifications: false,
      pushNotifications: true,
    });

    expect(user.preferences).toEqual({
      theme: 'dark',
      language: 'Spanish',
      notifications: { email: false, push: true },
    });
  });
});

describe('formatRate', () => {
  it('formats word, hour and flat rates', () => {
    expect(formatRate('0.75', 'word')).toBe('$0.75 / word');
    expect(formatRate('85', 'hour')).toBe('$85 / hour');
    expect(formatRate('1200', 'flat')).toBe('$1,200 flat');
  });

  it('ignores blank and non-numeric amounts', () => {
    expect(formatRate('', 'word')).toBeUndefined();
    expect(formatRate('   ', 'hour')).toBeUndefined();
    expect(formatRate('lots', 'flat')).toBeUndefined();
  });
});

describe('summarizeAvailability', () => {
  it('collapses a Monday–Friday week', () => {
    expect(
      summarizeAvailability({
        ...base,
        availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      })
    ).toBe('Mon–Fri · 09:00–17:00');
  });

  it('lists scattered days in week order', () => {
    expect(summarizeAvailability({ ...base, availableDays: ['friday', 'monday'] })).toBe('Mon, Fri · 09:00–17:00');
  });

  it('returns nothing when no days are picked', () => {
    expect(summarizeAvailability(base)).toBeUndefined();
  });
});
