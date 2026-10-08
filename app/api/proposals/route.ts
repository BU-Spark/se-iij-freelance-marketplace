import { NextRequest, NextResponse } from 'next/server';

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
      id: 'proposal_mock_001',
      gigId: body.gigId,
      freelancerId: body.freelancerId,
      coverLetter: body.coverLetter,
      proposedBudget: body.proposedBudget,
      status: 'SUBMITTED',
    },
    { status: 201 }
  );
}
