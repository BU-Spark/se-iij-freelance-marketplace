import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import type { ProfileRole, StoredAvailability } from '../../../types/profile.types';

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

type AvailabilityRow = {
  available_now: boolean | null;
  roles: string[] | null;
  freelancer_id: string | null;
  freelancer_availability: StoredAvailability | null;
  editor_id: string | null;
  editor_availability: StoredAvailability | null;
};

/** The shape the availability card reads; nulls mean "never set" */
type AvailabilityPayload = {
  /** which workspace's hours these are, so the page can word itself for the right side of the desk */
  role: ProfileRole;
  availableNow: boolean;
  timezone: string | null;
  days: string[];
  startsAt: string | null;
  endsAt: string | null;
};

/**
 * A person who works both sides keeps two patterns (a freelancer's hours and an editor's desk
 * hours), so the freelancer one wins only when they actually hold that role.
 */
const storedFor = (row: AvailabilityRow): { role: ProfileRole; stored: StoredAvailability | null } | null => {
  if (row.roles?.includes('freelancer') && row.freelancer_id) {
    return { role: 'freelancer', stored: row.freelancer_availability };
  }

  if (row.editor_id) return { role: 'editor', stored: row.editor_availability };

  return null;
};

const toPayload = (
  availableNow: boolean,
  role: ProfileRole,
  stored: StoredAvailability | null
): AvailabilityPayload => ({
  role,
  availableNow,
  timezone: stored?.timezone ?? null,
  days: stored?.days ?? [],
  startsAt: stored?.typicalWorkingWindow?.startsAt ?? null,
  endsAt: stored?.typicalWorkingWindow?.endsAt ?? null,
});

const SELECT_AVAILABILITY = `
  SELECT
    u.available_now,
    u.roles,
    f.user_id AS freelancer_id,
    f.availability AS freelancer_availability,
    e.user_id AS editor_id,
    e.availability AS editor_availability
  FROM users u
  LEFT JOIN freelancers f ON f.user_id = u.id
  LEFT JOIN editors e ON e.user_id = u.id
  WHERE u.clerk_id = $1
`;

/** The availability card, as the signed-in freelancer or editor last saved it */
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see your availability.' }, { status: 401 });
  }

  try {
    const { rows } = await db.query<AvailabilityRow>(SELECT_AVAILABILITY, [userId]);
    const row = rows[0];
    const held = row ? storedFor(row) : null;

    if (!row || !held) {
      return NextResponse.json(
        { error: 'Finish onboarding before setting availability.', code: 'onboarding_required' },
        { status: 404 }
      );
    }

    return NextResponse.json(toPayload(row.available_now === true, held.role, held.stored));
  } catch (error) {
    console.error('Failed to load availability.', error);
    return NextResponse.json({ error: 'Unable to load your availability right now.' }, { status: 500 });
  }
}

/**
 * Saves the weekly pattern and the "free right now" switch together. A person who holds both roles
 * gets both rows written, so neither card shows hours they did not set.
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

    // whichever role rows exist get the same hours; a role they do not hold simply updates nothing
    const freelancer = await client.query(
      `UPDATE freelancers f
          SET availability = $2::jsonb,
              updated_at = NOW()
         FROM users u
        WHERE u.clerk_id = $1
          AND f.user_id = u.id`,
      [userId, JSON.stringify(availability)]
    );

    const editor = await client.query(
      `UPDATE editors e
          SET availability = $2::jsonb,
              updated_at = NOW()
         FROM users u
        WHERE u.clerk_id = $1
          AND e.user_id = u.id`,
      [userId, JSON.stringify(availability)]
    );

    if (!freelancer.rowCount && !editor.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Finish onboarding for a role before setting availability.', code: 'role_required' },
        { status: 400 }
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ saved: true });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Failed to save availability.', error);
    return NextResponse.json({ error: 'Unable to save your availability right now.' }, { status: 500 });
  } finally {
    client?.release();
  }
}
