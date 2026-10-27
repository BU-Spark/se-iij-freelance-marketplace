import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import type { NewAssignment } from '../../types/assignments.types';
import { validateAssignment } from '../../utils/assignment.utils';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Reads the request body defensively; anything that is not a string becomes '' */
function toAssignment(body: Record<string, unknown>): NewAssignment {
  return {
    title: text(body.title),
    description: text(body.description),
    category: text(body.category),
    slug: text(body.slug),
    contact: text(body.contact),
    location: text(body.location),
    length: text(body.length),
    deadline: text(body.deadline),
    compensation: text(body.compensation),
  };
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to create an assignment.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'The assignment payload is not valid JSON.' }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: 'The assignment payload is invalid.' }, { status: 400 });
  }

  const input = toAssignment(body);
  const errors = validateAssignment(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: 'Please fix the highlighted fields.', errors }, { status: 400 });
  }

  let client: PoolClient | undefined;

  try {
    client = await db.connect();
    const connection = client;
    await connection.query('BEGIN');

    // The author and their organization come from the session, never from the request body.
    const authorResult = await connection.query<{ id: string; role: string; organization_id: string | null }>(
      `SELECT u.id, u.role, e.organization_id
         FROM users u
         LEFT JOIN editors e ON e.user_id = u.id
        WHERE u.clerk_id = $1`,
      [userId]
    );
    const author = authorResult.rows[0];

    if (!author) {
      await connection.query('ROLLBACK');
      return NextResponse.json(
        {
          error: 'Finish onboarding before creating an assignment.',
          code: 'onboarding_required',
        },
        { status: 400 }
      );
    }

    if (author.role !== 'editor') {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: 'Only editors can create assignments.' }, { status: 403 });
    }

    const inserted = await connection.query<{ id: string }>(
      `INSERT INTO assignments (
         organization_id, created_by_user_id, title, description, category, slug,
         contact, location, length, deadline, compensation
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        author.organization_id,
        author.id,
        input.title,
        input.description,
        input.category,
        input.slug,
        input.contact,
        input.location,
        input.length,
        input.deadline ? new Date(input.deadline) : null,
        input.compensation,
      ]
    );

    await connection.query('COMMIT');
    return NextResponse.json({ saved: true, id: inserted.rows[0]?.id }, { status: 201 });
  } catch (error) {
    await client?.query('ROLLBACK');

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      return NextResponse.json(
        { error: 'That slug is already used by another assignment.', errors: { slug: 'That slug is already used.' } },
        { status: 409 }
      );
    }

    console.error('Failed to create assignment.', error);
    return NextResponse.json({ error: 'Unable to create the assignment right now.' }, { status: 500 });
  } finally {
    client?.release();
  }
}
