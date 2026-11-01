import type { AccountProfile } from '../../../types/profile.types';

// TODO: replace with the signed-in user's profile from the API
export const MOCK_PROFILE: AccountProfile = {
  id: 'marcus',
  basic: {
    firstName: 'Marcus',
    lastName: 'Thorne',
    email: 'marcus.thorne@example.com',
    location: 'London, UK',
  },
  roles: [
    {
      role: 'freelancer',
      bio: 'Investigative reporter covering local government and public money in London. Comfortable with FOI requests and tight overnight deadlines.',
      facts: { typeOfWork: 'Reporting, explainers', beats: 'Local government, housing', rate: '$1.10 / word' },
    },
    {
      role: 'editor',
      bio: 'Contributing editor at Harbour Community News, running the local politics desk.',
      facts: {
        organisation: 'Harbour Community News',
        desk: 'Local politics',
        commissions: 'Accountability, explainers',
      },
    },
  ],
};
