import type { Pitch, PitchStatus } from '../../types/dashboard.types';

export const PITCH_STATUS_LABEL: Record<PitchStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  negotiating: 'Negotiating',
  accepted: 'Accepted',
  declined: 'Declined',
};

/* ------------------------------------------------------------------ */
/*  Temporary static pitches for the inbox                             */
/*  TODO: replace with data from the backend once the API exists       */
/* ------------------------------------------------------------------ */

/** A date `hours` ago, so mock pitches always look recent */
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

export const PITCHES: Pitch[] = [
  {
    id: 'shadow-budget',
    slug: 'shadow-budget-city-hall',
    category: 'Reporting/Writing',
    tags: ['City Hall', 'Investigative feature'],
    freelancer: { id: 'marcus', name: 'Marcus Thorne' },
    submittedAt: hoursAgo(3),
    status: 'new',
    summary: 'Documents show the council routed £4M through a shell contractor. Sources are on the record.',
    location: 'London',
    length: '2,000 words / 3 weeks',
    deadline: 'Three weeks from greenlight',
    rate: '$2,200 flat',
    description:
      "Sources: Named councillor + FOI documents in hand. Audience: Local ratepayers, watchdog readers. Assets: Contract PDFs, two named sources. Continues the accountability beat we've been building. I broke the initial procurement story in March.",
  },
  {
    id: 'diaspora-newsletter',
    slug: 'diaspora-newsletter-launch',
    category: 'Audience Engagement',
    tags: ['Newsletter', 'Community'],
    freelancer: { id: 'amara', name: 'Amara Diallo' },
    submittedAt: hoursAgo(24),
    status: 'new',
    summary:
      'A weekly newsletter for West African diaspora readers, built from our existing coverage plus community voices.',
    location: 'Remote',
    length: '6-week pilot',
    deadline: 'First issue in two weeks',
    rate: '$85 / hr',
    description:
      'Sources: Three community organisers, reader survey. Audience: Diaspora readers in the UK and US. Assets: Draft template, sign-up flow mockup. Grows a reader group we under-serve today. I ran a 20k-subscriber community newsletter for two years.',
  },
  {
    id: 'grant-local-news',
    slug: 'grant-proposal-local-news-fund',
    category: 'Grant/Sponsorship Proposals',
    tags: ['Funding'],
    freelancer: { id: 'amara', name: 'Amara Diallo' },
    submittedAt: hoursAgo(48),
    status: 'reviewed',
    summary: 'Draft a proposal to the Local News Fund to pay for a year of city hall coverage.',
    location: 'Remote',
    length: '10-page proposal',
    deadline: 'Fund closes in 4 weeks',
    rate: '$1,200 flat',
    description:
      'Sources: Past coverage metrics, editor interviews. Audience: Grant committee. Assets: Last year’s budget, audience numbers. Funds the beat this desk wants to grow. I’ve written three successful journalism grants.',
  },
  {
    id: 'transit-fare',
    slug: 'transit-fare-hike-riders',
    category: 'Reporting/Writing',
    tags: ['Transit', 'Explainer + rider voices'],
    freelancer: { id: 'elena', name: 'Elena Rodriguez' },
    submittedAt: hoursAgo(72),
    status: 'accepted',
    summary:
      "The fare hike lands next month. I'd ride four lines across a week and pair rider interviews with the board's own ridership modeling.",
    location: 'Manchester',
    length: '1,400 words / 2 weeks',
    deadline: 'Two weeks from greenlight',
    rate: '$1.10 / word',
    description:
      "Sources: Transit board member, union rep, three named riders. Audience: Daily commuters, transit-dependent readers. Assets: Board modeling spreadsheet, 6 rider interviews lined up. Service journalism on a change that hits every reader's wallet. I covered the last two fare reviews for a regional daily.",
  },
  {
    id: 'harbour-photo',
    slug: 'harbour-redevelopment-photo-essay',
    category: 'Visuals',
    tags: ['Photo essay'],
    freelancer: { id: 'priya', name: 'Priya Natarajan' },
    submittedAt: hoursAgo(96),
    status: 'accepted',
    summary: 'A photo essay following three families as the harbour redevelopment changes their street.',
    location: 'Harbour district',
    length: '12–15 images',
    deadline: 'Three weeks from greenlight',
    rate: '$650 flat',
    description:
      'Sources: Three families, residents’ association. Audience: Local readers, weekend edition. Assets: Location scouting shots. Gives a human face to the development story. I’ve photographed the harbour area for five years.',
  },
  {
    id: 'ai-founder',
    slug: 'ai-startup-founder-profile',
    category: 'Reporting/Writing',
    tags: ['Tech', 'Profile'],
    freelancer: { id: 'satoshi', name: 'Satoshi Tanaka' },
    submittedAt: hoursAgo(120),
    status: 'declined',
    summary: 'A profile of a local AI startup founder raising a big round.',
    location: 'Tokyo',
    length: '1,200 words / 1 week',
    deadline: 'Next week',
    rate: '$0.80 / word',
    description:
      'Sources: Founder, two investors. Audience: Tech and business readers. Assets: Interview already booked. Business coverage the desk asked for. I cover the Tokyo startup scene.',
  },
  {
    id: 'county-fair',
    slug: 'county-fair-season-roundup',
    category: 'Multimedia',
    tags: ['Seasonal'],
    freelancer: { id: 'jonah', name: 'Jonah Weiss' },
    submittedAt: hoursAgo(144),
    status: 'declined',
    summary: 'A video and photo roundup of this year’s county fairs.',
    location: 'Regional',
    length: '3-minute video + gallery',
    deadline: 'End of the month',
    rate: '$900 flat',
    description:
      'Sources: Fair organisers, exhibitors. Audience: Weekend readers. Assets: Camera kit, drone. Light seasonal content for the weekend. I shot last year’s fair coverage.',
  },
];
