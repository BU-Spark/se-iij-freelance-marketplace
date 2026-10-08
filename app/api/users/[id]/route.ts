import { NextResponse } from 'next/server';

const mockUsers = {
  user_001: {
    id: 'user_001',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: 'FREELANCER',
    verificationStatus: 'VERIFIED',
    headline: 'Full-stack developer',
    skills: ['Next.js', 'TypeScript'],
  },
  user_002: {
    id: 'user_002',
    firstName: 'Jamie',
    lastName: 'Lee',
    role: 'CLIENT',
    verificationStatus: 'PENDING',
    headline: 'Product designer',
    skills: ['Product design', 'Figma'],
  },
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = mockUsers[id as keyof typeof mockUsers];

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
