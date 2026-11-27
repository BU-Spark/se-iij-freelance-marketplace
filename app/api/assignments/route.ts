import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { listDeskAssignments, loadAssignmentViewer } from '../../../lib/assignments';
import { listApplicantsFor } from '../../../lib/assignmentResponses';
import { combineLengthAndTime, isRecord, parseAssignmentBody, validateAssignment } from '../../utils/assignment.utils';
import { toDeskAssignment } from '../../utils/dashboard.utils';
import type { PoolClient } from 'pg';

export const runtime = 'nodejs';

/** The next page of the desk's assignments; `?after=<id>` is the last one already on screen. */
export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'You must be signed in to see assignments.' }, { status: 401 });
  }

  try {
    const viewer = await loadAssignmentViewer(userId);
    const after = new URL(request.url).searchParams.get('after');
    const page = await listDeskAssignments(viewer, { after });
    const applicants = await listApplicantsFor(page.items.map((item) => item.id));

    return NextResponse.json({
      items: page.items.map((item) => toDeskAssignment(item, applicants[item.id])),
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error('Failed to load the next page of assignments.', error);
    return NextResponse.json({ error: 'Unable to load assignments right now.' }, { status: 500 });
  }
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

  const input = parseAssignmentBody(body);
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
    const authorResult = await connection.query<{ id: string; roles: string[]; organization_id: string | null }>(
      `SELECT u.id, u.roles, e.organization_id
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

    if (!author.roles?.includes('editor')) {
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
        combineLengthAndTime(input.length, input.time),
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
