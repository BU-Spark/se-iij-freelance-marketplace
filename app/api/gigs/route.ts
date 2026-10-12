import { NextRequest, NextResponse } from 'next/server';
import { mockGigs } from '@/app/mocks/gigs';

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  const gigs = query
    ? mockGigs.filter((gig) => `${gig.title} ${gig.description}`.toLowerCase().includes(query))
    : mockGigs;

  return NextResponse.json({ gigs, total: gigs.length });
}
