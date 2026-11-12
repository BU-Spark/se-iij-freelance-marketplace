import type { Organization } from '../../../types/organization.types';

/** What a freelancer needs to know about a newsroom before pitching it */
export type OrgProfile = Pick<Organization, 'id' | 'name' | 'city' | 'bio'> & {
  tagline: string;
  beats: string[];
  openAssignments: number;
  rate: string;
  founded: string;
  staffSize: string;
  cadence: string;
  website: string;
  coverage: string[];
  paymentTerms: string;
};

/*
 * Temporary sample newsrooms; ids match the onboarding org picker (DEFAULT_ORGS).
 * TODO: load from the backend once an organizations table and API exist.
 */
export const ORGANIZATIONS: OrgProfile[] = [
  {
    id: 'meridian',
    name: 'The Meridian Post',
    city: 'New York',
    tagline: 'Metro and national news with a civic-accountability focus',
    beats: ['Politics', 'Government Accountability', 'Law/Legal Issues'],
    openAssignments: 4,
    rate: '$1.00 / word',
    founded: 'Founded 1998',
    staffSize: '~120 staff',
    cadence: 'Daily digital, Sunday print',
    website: 'meridianpost.example',
    bio: 'The Meridian Post covers New York City and national politics, with a standing investigations desk and an opinion section that commissions outside voices weekly.',
    coverage: ['City Hall and the courts', 'State and national elections', 'Housing and transit'],
    paymentTerms: 'Net-30 after publication. Reasonable reporting expenses reimbursed with receipts.',
  },
  {
    id: 'crosswind',
    name: 'Crosswind Weekly',
    city: 'Berlin',
    tagline: 'Long-form European features and narrative reporting',
    beats: ['Foreign Policy', 'Culture', 'Climate'],
    openAssignments: 2,
    rate: '$0.80 / word',
    founded: 'Founded 2009',
    staffSize: '~35 staff',
    cadence: 'Weekly magazine',
    website: 'crosswind.example',
    bio: 'Crosswind Weekly publishes deeply reported features from across Europe. Editors favour narrative pieces with strong access and a clear reporting plan.',
    coverage: ['Migration and borders', 'Energy transition', 'Arts and ideas'],
    paymentTerms: 'Half on acceptance, half on publication. Kill fee of 25%.',
  },
  {
    id: 'signal',
    name: 'Signal Room',
    city: 'Remote',
    tagline: 'A nonprofit newsroom on technology and public life',
    beats: ['Tech', 'Health', 'Investigations'],
    openAssignments: 3,
    rate: '$600 / story',
    founded: 'Founded 2017',
    staffSize: '~20 staff',
    cadence: 'Twice-weekly newsletter, monthly investigations',
    website: 'signalroom.example',
    bio: 'Signal Room is a fully remote nonprofit newsroom reporting on how technology shapes health, work and democracy. Every story is free to republish.',
    coverage: ['Platform accountability', 'Health data and privacy', 'AI in public services'],
    paymentTerms: 'Net-15 after filing.',
  },
  {
    id: 'broadsheet',
    name: 'Broadsheet Pacific',
    city: 'Tokyo',
    tagline: 'English-language Asia-Pacific news and analysis',
    beats: ['World', 'Business', 'National Security'],
    openAssignments: 1,
    rate: '$0.95 / word',
    founded: 'Founded 2011',
    staffSize: '~40 staff',
    cadence: 'Continuous digital, weekly analysis',
    website: 'broadsheetpacific.example',
    bio: 'Broadsheet Pacific is headquartered in Tokyo with bureaus in Seoul and Manila. It values reporters with in-country language skills and long-term sourcing.',
    coverage: ['Regional trade', 'Security and alliances', 'Demographic change'],
    paymentTerms: 'Net-30. Translator and fixer costs reimbursed with receipts.',
  },
];
