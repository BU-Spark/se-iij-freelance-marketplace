import { NextResponse } from 'next/server';
import { mockUsers } from '@/app/mocks/users';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = mockUsers[id as keyof typeof mockUsers];

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}
