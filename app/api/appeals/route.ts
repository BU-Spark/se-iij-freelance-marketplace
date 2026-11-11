import { NextResponse } from 'next/server';
import { submitAppeal } from '../../../lib/appeals';
import { isValidEmail } from '../../utils/validation.utils';

export const runtime = 'nodejs';

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Takes an appeal from a suspended person. This route is deliberately public: a ban stops them
 * signing in, so they cannot be authenticated when they ask for a second look.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The appeal is not valid JSON.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'The appeal is invalid.' }, { status: 400 });
  }

  const { email, message } = body as { email?: unknown; message?: unknown };

  if (typeof email !== 'string' || !isValidEmail(email.trim())) {
    return NextResponse.json({ error: 'Enter the email address on your account.' }, { status: 400 });
  }

  if (typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Tell the team why the suspension should be looked at again.' }, { status: 400 });
  }

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Keep your appeal to ${MAX_MESSAGE_LENGTH} characters or fewer.` },
      { status: 400 }
    );
  }

  try {
    await submitAppeal({ email: email.trim(), message: message.trim() });
    // The same answer for everyone, so the form cannot be used to find out who is suspended
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Failed to record an appeal.', error);
    return NextResponse.json({ error: 'Unable to send your appeal right now.' }, { status: 500 });
  }
}
