import { NextRequest, NextResponse } from 'next/server';

const mockGigs = [
  {
    id: 'gig_001',
    title: 'Build a marketplace landing page',
    description: 'Create a responsive landing page in Next.js.',
    budget: 1200,
    currency: 'USD',
    clientId: 'user_002',
    status: 'OPEN',
  },
  {
    id: 'gig_002',
    title: 'Design a mobile app dashboard',
    description: 'Create a clean dashboard design in Figma.',
    budget: 800,
    currency: 'USD',
    clientId: 'user_002',
    status: 'OPEN',
  },
];

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const gigs = query
    ? mockGigs.filter((gig) => `${gig.title} ${gig.description}`.toLowerCase().includes(query))
    : mockGigs;

  return NextResponse.json({ gigs, total: gigs.length });
}
