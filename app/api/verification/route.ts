import { NextRequest, NextResponse } from 'next/server';
import { mockVerification } from '@/app/mocks/verification';

type VerificationDocument = { type: string; fileName: string };

export async function POST(request: NextRequest) {
  let body: { userId?: unknown; documents?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'userId and at least one valid document are required' }, { status: 400 });
  }

  const documents = body.documents as VerificationDocument[] | undefined;
  const validDocuments =
    Array.isArray(documents) &&
    documents.length > 0 &&
    documents.every(
      (document) =>
        typeof document?.type === 'string' &&
        document.type.trim().length > 0 &&
        typeof document?.fileName === 'string' &&
        document.fileName.trim().length > 0
    );

  if (typeof body.userId !== 'string' || !body.userId.trim() || !validDocuments) {
    return NextResponse.json({ error: 'userId and at least one valid document are required' }, { status: 400 });
  }

  return NextResponse.json(mockVerification, { status: 201 });
}
