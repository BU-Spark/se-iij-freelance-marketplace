import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import type { StoredAvailability } from '../../../types/profile.types';

export const runtime = 'nodejs';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

type AvailabilityRow = { available_now: boolean | null; availability: StoredAvailability | null };

/** The shape the availability card reads and writes; nulls mean "never set" */
type AvailabilityPayload = {
  availableNow: boolean;
  timezone: string | null;
  days: string[];
  startsAt: string | null;
  endsAt: string | null;
};

const fromRow = (row: AvailabilityRow): AvailabilityPayload => ({
  availableNow: row.available_now === true,
  timezone: row.availability?.timezone ?? null,
  days: row.availability?.days ?? [],
  startsAt: row.availability?.typicalWorkingWindow?.startsAt ?? null,
  endsAt: row.availability?.typicalWorkingWindow?.endsAt ?? null,
});

const SELECT_AVAILABILITY = `
  SELECT
    u.available_now,
    f.availability
  FROM users u
  JOIN freelancers f ON f.user_id = u.id
  WHERE u.clerk_id = $1
`;

/** The freelancer workspace's availability card, as the signed-in person last saved it */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see your availability.' }, { status: 401 });
  }

  try {
    const { rows } = await db.query<AvailabilityRow>(SELECT_AVAILABILITY, [userId]);

    if (!rows[0]) {
      return NextResponse.json(
        { error: 'Finish onboarding before setting availability.', code: 'onboarding_required' },
        { status: 404 }
      );
    }

    return NextResponse.json(fromRow(rows[0]));
  } catch (error) {
    console.error('Failed to load availability.', error);
    return NextResponse.json({ error: 'Unable to load your availability right now.' }, { status: 500 });
  }
}

/**
 * Saves the weekly pattern and the "free right now" switch together. Editors read both, so they
 * are written in one transaction: a half-saved availability would show the wrong thing on a card.
 */
export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to change your availability.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The availability payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The availability payload is invalid.' }, { status: 400 });
  }

  const { availableNow, timezone, days, startsAt, endsAt } = body;

  if (typeof availableNow !== 'boolean') {
    return NextResponse.json({ error: 'Say whether you are free right now.' }, { status: 400 });
  }

  if (typeof timezone !== 'string' || !timezone.trim() || !isTimeZone(timezone.trim())) {
    return NextResponse.json({ error: 'Enter a valid time zone, such as America/New_York.' }, { status: 400 });
  }

  if (!Array.isArray(days) || !days.every((day) => typeof day === 'string' && DAYS.includes(day))) {
    return NextResponse.json({ error: 'Choose your working days from the list.' }, { status: 400 });
  }

  if (typeof startsAt !== 'string' || typeof endsAt !== 'string' || !TIME.test(startsAt) || !TIME.test(endsAt)) {
    return NextResponse.json({ error: 'Enter a start and end time, such as 09:00 and 17:00.' }, { status: 400 });
  }

  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: 'End time must be later than start time. Choose a window within one day.' },
      { status: 400 }
    );
  }

  const availability: StoredAvailability = {
    timezone: timezone.trim(),
    days: [...new Set(days as string[])],
    typicalWorkingWindow: { startsAt, endsAt },
  };

  let client;

  try {
    client = await db.connect();
    await client.query('BEGIN');

    const updated = await client.query(
      `UPDATE users
          SET available_now = $2,
              updated_at = NOW()
        WHERE clerk_id = $1
        RETURNING id`,
      [userId, availableNow]
    );

    if (!updated.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Finish onboarding before setting availability.', code: 'onboarding_required' },
        { status: 404 }
      );
    }

    const saved = await client.query(
      `UPDATE freelancers f
          SET availability = $2::jsonb,
              updated_at = NOW()
         FROM users u
        WHERE u.clerk_id = $1
          AND f.user_id = u.id`,
      [userId, JSON.stringify(availability)]
    );

    if (!saved.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Only freelancers set availability.', code: 'freelancer_required' },
        { status: 400 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ saved: true, ...fromRow({ available_now: availableNow, availability }) });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Failed to save availability.', error);
    return NextResponse.json({ error: 'Unable to save your availability right now.' }, { status: 500 });
  } finally {
    client?.release();
  }
}
