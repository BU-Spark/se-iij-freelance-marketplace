import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getAccount, reactivateAccount, suspendAccount } from '../../../../../lib/accounts';
import { resolveAppeals } from '../../../../../lib/appeals';
import { isSignedInUserAdmin } from '../../../../../lib/auth';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

const MAX_REASON_LENGTH = 500;

/**
 * Suspends or reactivates one account. Middleware guards the /admin pages, not /api, so the team
 * check lives here. Unlike the read paths this fails closed: if Clerk cannot say who the caller is,
 * nobody changes an account.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to change an account.' }, { status: 401 });
  }

  try {
    if (!(await isSignedInUserAdmin())) {
      return NextResponse.json({ error: 'Only the Story Match team can change accounts.' }, { status: 403 });
    }
  } catch (error) {
    console.error('Could not check whether this person may change accounts.', error);
    return NextResponse.json({ error: 'Only the Story Match team can change accounts.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The account update is not valid JSON.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'The account update is invalid.' }, { status: 400 });
  }

  const { status, reason } = body as { status?: unknown; reason?: unknown };

  if (status !== 'suspended' && status !== 'active') {
    return NextResponse.json({ error: 'Choose whether to suspend or reactivate the account.' }, { status: 400 });
  }

  let suspensionReason = '';
  if (status === 'suspended') {
    if (typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Give a reason for the suspension.' }, { status: 400 });
    }

    suspensionReason = reason.trim();
    if (suspensionReason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Keep the reason to ${MAX_REASON_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }
  }

  const { id } = await params;

  try {
    const account = await getAccount(id);

    // Same answer for "missing" and "not an account" so ids from elsewhere give nothing away
    if (!account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // Suspensions are for other people; an admin must not be able to lock themselves out
    if (status === 'suspended' && account.clerk_id === userId) {
      return NextResponse.json({ error: 'You cannot suspend your own account.' }, { status: 400 });
    }

    const updated =
      status === 'suspended' ? await suspendAccount(account.id, suspensionReason) : await reactivateAccount(account.id);

    if (!updated) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // Reactivating is also the answer to an appeal, so settle any that are still waiting
    if (status === 'active') {
      try {
        await resolveAppeals(account.id);
      } catch (error) {
        console.error('Could not close the appeals for this account.', error);
      }
    }

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error('Failed to change the account status.', error);
    return NextResponse.json({ error: 'Unable to update this account right now.' }, { status: 500 });
  }
}
