import { NextRequest, NextResponse } from 'next/server';
import { mockProposal } from '@/app/mocks/proposals';

export async function POST(request: NextRequest) {
  let body: {
    gigId?: unknown;
    freelancerId?: unknown;
    coverLetter?: unknown;
    proposedBudget?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: 'gigId, freelancerId, coverLetter, and a positive proposedBudget are required',
      },
      { status: 400 }
    );
  }

  if (
    typeof body.gigId !== 'string' ||
    !body.gigId.trim() ||
    typeof body.freelancerId !== 'string' ||
    !body.freelancerId.trim() ||
    typeof body.coverLetter !== 'string' ||
    !body.coverLetter.trim() ||
    typeof body.proposedBudget !== 'number' ||
    !Number.isFinite(body.proposedBudget) ||
    body.proposedBudget <= 0
  ) {
    return NextResponse.json(
      {
        error: 'gigId, freelancerId, coverLetter, and a positive proposedBudget are required',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      id: mockProposal.id,
      gigId: body.gigId,
      freelancerId: body.freelancerId,
      coverLetter: body.coverLetter,
      proposedBudget: body.proposedBudget,
      status: mockProposal.status,
    },
    { status: 201 }
  );
}
