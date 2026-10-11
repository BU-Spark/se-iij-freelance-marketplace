import { EMPTY } from '../onboarding/constants';
import { Role } from '../types/user.types';
import { toEditor, toFreelancer, toProfile } from './profile.utils';

const base = { ...EMPTY, firstName: ' Sarah ', lastName: 'Jenkins', email: 'sarah@newsroom.example' };

describe('profile mappers', () => {
  it('maps editor form data onto the Editor type', () => {
    const editor = toEditor({ ...base, jobTitle: 'News Editor', yearsAtDesk: 4, desks: ['Politics'] });

    expect(editor.user).toEqual({
      email: 'sarah@newsroom.example',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      shortBio: undefined,
      roles: [Role.EDITOR],
    });
    expect(editor).toMatchObject({
      organizationId: 'meridian',
      jobTitle: 'News Editor',
      yearsAtDesk: 4,
      desks: ['Politics'],
    });
  });

  it('maps freelancer form data onto the Freelancer type', () => {
    const portfolio = [{ id: 'portfolio-link', type: 'article' as const, title: 'Portfolio', url: 'https://a.co' }];
    const freelancer = toFreelancer({
      ...base,
      shortBio: 'Climate reporter',
      reportingBeats: ['Climate'],
      workMediums: ['Photo'],
      portfolio,
    });

    expect(freelancer.user.roles).toEqual([Role.USER]);
    expect(freelancer.user.shortBio).toBe('Climate reporter');
    expect(freelancer).toMatchObject({ reportingBeats: ['Climate'], workMediums: ['Photo'], portfolio });
    expect(freelancer.location).toBeUndefined();
  });

  it('picks the mapper for the chosen role', () => {
    expect(toProfile('editor', base)).toHaveProperty('jobTitle');
    expect(toProfile('freelancer', base)).toHaveProperty('reportingBeats');
  });
});
