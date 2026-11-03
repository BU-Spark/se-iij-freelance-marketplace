import type { AccountProfile } from '../../../types/profile.types';

/**
 * Sample profile for tests and stories. The real data comes from `/api/profile`;
 * nothing in the app reads this at runtime.
 */
export const MOCK_PROFILE: AccountProfile = {
  id: 'marcus',
  basic: {
    firstName: 'Marcus',
    lastName: 'Thorne',
    email: 'marcus.thorne@example.com',
    shortBio: 'Investigative reporter covering local government and public money in London.',
    longBio:
      'Comfortable with FOI requests and tight overnight deadlines. Previously at the Harbour Community News local politics desk.',
  },
  roles: [
    {
      role: 'freelancer',
      facts: {
        location: 'London, UK',
        rate: '$1.10 / word',
        communityCovered: 'Hackney, Tower Hamlets',
        reportingBeats: ['Local government', 'Housing'],
        beatTags: ['Accountability', 'Public money'],
        workMediums: ['Reporting', 'Explainers'],
        tools: ['Excel', 'Datawrapper'],
        availability: 'Mon–Fri · 09:00–17:00',
      },
    },
    {
      role: 'editor',
      facts: {
        organizationId: 'meridian',
        jobTitle: 'Contributing editor',
        desks: ['Local politics'],
        yearsAtDesk: 4,
        location: 'London, UK',
        preferredPitchFormat: 'Short email pitch',
        averageResponseTime: 2,
        interestedTopics: ['Accountability', 'Explainers'],
        editorialPreferences: ['Data-backed', 'On the record'],
        lookingFor: ['Investigations', 'Profiles'],
        availability: 'Mon–Fri · 09:00–17:00',
      },
    },
  ],
};
