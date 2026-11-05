import { EMPTY } from '../onboarding/constants';
import type { ProfileData } from '../types/onboarding.types';
import { Role } from '../types/user.types';
import { ROLE_CONFIG } from '../components/Profile/config/roleConfig';
import type { ProfileRow } from '../types/profile.types';
import {
  cleanBasic,
  cleanEditorFacts,
  cleanFreelancerFacts,
  factText,
  parseRate,
  formatRate,
  summarizeAvailability,
  toAccountProfile,
  toOnboardingData,
  toEditor,
  toFreelancer,
  toProfile,
  validateBasic,
} from './profile.utils';

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
import { fullName, missingRoles } from './profile.utils';
import { MOCK_PROFILE } from '../components/Profile/config/constants';

describe('profile helpers', () => {
  it('joins first and last name', () => {
    expect(fullName(MOCK_PROFILE)).toBe('Marcus Thorne');
  });

  it('lists the roles a person does not have yet', () => {
    expect(missingRoles(MOCK_PROFILE, ['freelancer', 'editor'])).toEqual([]);
    const onlyFreelancer = { ...MOCK_PROFILE, roles: [MOCK_PROFILE.roles[0]] };
    expect(missingRoles(onlyFreelancer, ['freelancer', 'editor'])).toEqual(['editor']);
  });
});

describe('validateBasic', () => {
  const basic = { firstName: 'Sarah', lastName: '', email: 'sarah@newsroom.example', shortBio: '', longBio: '' };

  it('accepts a first name and a valid email', () => {
    expect(validateBasic(basic)).toEqual({});
  });

  it('asks for a first name', () => {
    expect(validateBasic({ ...basic, firstName: '  ' })).toEqual({ firstName: 'Add your first name.' });
  });

  it('rejects an address without a domain', () => {
    expect(validateBasic({ ...basic, email: 'sarah@' })).toEqual({ email: 'Enter a valid email address.' });
  });
});

describe('factText', () => {
  it('joins chip lists and renders numbers', () => {
    expect(factText(['Politics', 'Housing'])).toBe('Politics, Housing');
    expect(factText(4)).toBe('4');
  });

  it('resolves an organisation id through the resolver', () => {
    expect(factText('meridian', () => 'The Meridian Post')).toBe('The Meridian Post');
  });
});

const baseRow: ProfileRow = {
  id: 'user-1',
  email: 'sarah@newsroom.example',
  first_name: 'Sarah',
  last_name: 'Jenkins',
  short_bio: 'Local politics reporter',
  long_bio: null,
  photo_key: 'photos/user-1/photo.jpg',
  roles: ['editor'],
  preferences: null,
  editor_id: 'user-1',
  organization_id: 'meridian',
  desks: ['Politics'],
  job_title: 'News Editor',
  years_at_desk: 4,
  editor_location: 'Leeds, UK',
  pitch_preferences: {
    preferredPitchFormat: 'Short email pitch',
    averageResponseTime: 3,
    interestedTopics: ['Politics'],
    editorialPreferences: ['Data-backed'],
    lookingFor: ['Investigations'],
  },
  editor_availability: {
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    typicalWorkingWindow: { startsAt: '09:00', endsAt: '17:00' },
  },
  freelancer_id: null,
  freelancer_location: null,
  rate: null,
  community_covered: null,
  reporting_beats: null,
  beat_tags: null,
  work_mediums: null,
  tools: null,
  portfolio: null,
  freelancer_availability: null,
};

const freelancerRow: ProfileRow = {
  ...baseRow,
  roles: ['freelancer'],
  editor_id: null,
  organization_id: null,
  desks: null,
  job_title: null,
  years_at_desk: null,
  editor_location: null,
  pitch_preferences: null,
  editor_availability: null,
  freelancer_id: 'user-1',
  freelancer_location: 'Bristol, UK',
  rate: '$1.10 / word',
  community_covered: 'Bristol',
  reporting_beats: ['Housing'],
  beat_tags: ['Accountability'],
  work_mediums: ['Reporting'],
  tools: ['Excel'],
  freelancer_availability: {
    days: ['monday', 'tuesday'],
    typicalWorkingWindow: { startsAt: '10:00', endsAt: '16:00' },
  },
};

describe('toAccountProfile', () => {
  it('maps the row and the signed photo URL onto the panel profile', () => {
    const profile = toAccountProfile(baseRow, 'https://signed.example/photo.jpg');

    expect(profile.basic).toEqual({
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah@newsroom.example',
      shortBio: 'Local politics reporter',
      longBio: '',
      photoKey: 'photos/user-1/photo.jpg',
      photoUrl: 'https://signed.example/photo.jpg',
    });
    expect(profile.roles[0]).toMatchObject({
      role: 'editor',
      facts: {
        organizationId: 'meridian',
        jobTitle: 'News Editor',
        desks: ['Politics'],
        yearsAtDesk: 4,
        availability: 'Mon–Fri · 09:00–17:00',
      },
    });
  });

  it('maps the freelancer columns to the freelancer card', () => {
    expect(toAccountProfile(freelancerRow).roles).toEqual([
      {
        role: 'freelancer',
        facts: {
          location: 'Bristol, UK',
          rate: '$1.10 / word',
          communityCovered: 'Bristol',
          reportingBeats: ['Housing'],
          beatTags: ['Accountability'],
          workMediums: ['Reporting'],
          tools: ['Excel'],
          availability: 'Mon, Tue · 10:00–16:00',
        },
      },
    ]);
  });

  it('keeps a role that has a row even when users.roles has not caught up', () => {
    expect(toAccountProfile({ ...baseRow, roles: [] }).roles.map((r) => r.role)).toEqual(['editor']);
  });

  it('shows both roles in the canonical order', () => {
    const profile = toAccountProfile({ ...baseRow, roles: ['editor', 'freelancer'], freelancer_id: 'user-1' });
    expect(profile.roles.map((r) => r.role)).toEqual(['freelancer', 'editor']);
  });

  it('produces a fact for every field the panel renders', () => {
    for (const details of [toAccountProfile(baseRow).roles[0], toAccountProfile(freelancerRow).roles[0]]) {
      ROLE_CONFIG[details.role].fields.forEach((field) => expect(details.facts).toHaveProperty(field.key));
    }
  });
});

describe('cleanBasic', () => {
  it('trims the text, stores blank bios as null and ignores wrong types', () => {
    expect(
      cleanBasic({ firstName: ' Sarah ', lastName: ' Jenkins ', email: 's@x.co', shortBio: ' ', longBio: '' })
    ).toEqual({ firstName: 'Sarah', lastName: 'Jenkins', email: 's@x.co', shortBio: null, longBio: null });
    expect(cleanBasic({ firstName: 42, email: null })).toMatchObject({ firstName: '', email: '' });
  });
});

describe('cleanEditorFacts', () => {
  const facts = {
    organizationId: 'meridian',
    jobTitle: ' News Editor ',
    desks: [' Politics ', ''],
    yearsAtDesk: '4',
    location: ' Leeds ',
    preferredPitchFormat: 'Email',
    averageResponseTime: 3,
    interestedTopics: ['Politics'],
    editorialPreferences: [],
    lookingFor: ['Investigations'],
  };

  it('coerces numbers and trims chip lists', () => {
    expect(cleanEditorFacts(facts)).toEqual({
      ok: true,
      role: 'editor',
      value: expect.objectContaining({
        jobTitle: 'News Editor',
        desks: ['Politics'],
        yearsAtDesk: 4,
        location: 'Leeds',
        organizationId: 'meridian',
      }),
    });
  });

  it('requires a job title and a numeric years at desk', () => {
    expect(cleanEditorFacts({ ...facts, jobTitle: '' })).toEqual({
      ok: false,
      error: 'Add the job title for this desk.',
    });
    expect(cleanEditorFacts({ ...facts, yearsAtDesk: 'four' })).toEqual({
      ok: false,
      error: 'Years at desk must be a number.',
    });
  });
});

describe('cleanFreelancerFacts', () => {
  it('keeps empty fields as null so the card shows a dash', () => {
    expect(cleanFreelancerFacts({ location: ' ', rate: '$50 / hour', tools: ['Excel', 7] })).toEqual({
      ok: true,
      role: 'freelancer',
      value: {
        location: null,
        rate: '$50 / hour',
        communityCovered: null,
        reportingBeats: [],
        beatTags: [],
        workMediums: [],
        tools: ['Excel'],
      },
    });
  });
});

describe('parseRate', () => {
  it('takes apart the strings formatRate writes', () => {
    expect(parseRate('$1.10 / word')).toEqual({ rateAmount: '1.10', rateUnit: 'word' });
    expect(parseRate('$85 / hour')).toEqual({ rateAmount: '85', rateUnit: 'hour' });
    expect(parseRate('$1,200 flat')).toEqual({ rateAmount: '1200', rateUnit: 'flat' });
  });

  it('leaves anything it cannot read blank rather than guessing', () => {
    expect(parseRate('')).toEqual({ rateAmount: '', rateUnit: 'word' });
    expect(parseRate('depends on the story')).toEqual({ rateAmount: '', rateUnit: 'word' });
  });

  it('survives a round trip through formatRate', () => {
    const formatted = formatRate('1.25', 'word');
    expect(parseRate(formatted ?? '')).toEqual({ rateAmount: '1.25', rateUnit: 'word' });
  });
});

describe('toOnboardingData', () => {
  it('rebuilds every answer onboarding asks for', () => {
    const data = toOnboardingData(baseRow);

    expect(data).toMatchObject({
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah@newsroom.example',
      shortBio: 'Local politics reporter',
      longBio: '',
      jobTitle: 'News Editor',
      yearsAtDesk: 4,
      organizationId: 'meridian',
      desks: ['Politics'],
      location: 'Leeds, UK',
      preferredPitchFormat: 'Short email pitch',
      averageResponseTime: 3,
      interestedTopics: ['Politics'],
      editorialPreferences: ['Data-backed'],
      lookingFor: ['Investigations'],
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      workdayStart: '09:00',
      workdayEnd: '17:00',
    });
  });

  it('restores the freelancer answers, including the rate and portfolio', () => {
    const data = toOnboardingData(freelancerRow);

    expect(data).toMatchObject({
      rateAmount: '1.10',
      rateUnit: 'word',
      reportingBeats: ['Housing'],
      beatTags: ['Accountability'],
      workMediums: ['Reporting'],
      tools: ['Excel'],
      communityCovered: 'Bristol',
      location: 'Bristol, UK',
      workdayStart: '10:00',
      workdayEnd: '16:00',
    });
  });

  it('keeps stored preferences and the photo key, so a re-save cannot wipe them', () => {
    const data = toOnboardingData({
      ...baseRow,
      photo_key: 'photos/user-1/photo.jpg',
      preferences: { theme: 'dark', language: 'French', notifications: { email: false, push: true } },
    });

    expect(data).toMatchObject({
      photoKey: 'photos/user-1/photo.jpg',
      theme: 'dark',
      language: 'French',
      emailNotifications: false,
      pushNotifications: true,
    });
  });

  it('falls back to onboarding defaults when nothing is stored', () => {
    const data = toOnboardingData({ ...baseRow, preferences: null, editor_availability: null });

    expect(data).toMatchObject({
      theme: 'system',
      language: 'English',
      emailNotifications: true,
      pushNotifications: false,
      workdayStart: '09:00',
      workdayEnd: '17:00',
      availableDays: [],
    });
  });
});
