import { db } from './db';
import type { Pitch, PitchFeedback, PitchStatus } from '../app/types/dashboard.types';

/** A row from the `pitches` table, joined to the freelancer's name */
export type PitchRow = {
  id: string;
  freelancer_user_id: string;
  target_editor_user_id: string;
  slug: string;
  category: string;
  tags: string[];
  summary: string;
  description: string;
  location: string;
  length: string;
  deadline: string;
  compensation: string;
  status: PitchStatus;
  feedback: PitchFeedback | null;
  feedback_at: Date | null;
  submitted_at: Date;
  created_at: Date;
  updated_at: Date;
  freelancer_name: string;
};

/** Reads come back through `p`, joined to `u` (the freelancer) so the inbox can name them */
const PITCH_COLUMNS = `
  p.id, p.freelancer_user_id, p.target_editor_user_id, p.slug, p.category, p.tags,
  p.summary, p.description, p.location, p.length, p.deadline, p.compensation,
  p.status, p.feedback, p.feedback_at, p.submitted_at, p.created_at, p.updated_at,
  u.first_name || ' ' || u.last_name AS freelancer_name
`;

const PITCH_FROM = `
  FROM pitches p
  JOIN users u ON u.id = p.freelancer_user_id
`;

/** Turns a snake_case database row into the camelCase model the inbox and "My pitches" render */
export function toPitch(row: PitchRow): Pitch {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    tags: row.tags ?? [],
    freelancer: { id: row.freelancer_user_id, name: row.freelancer_name },
    submittedAt: new Date(row.submitted_at),
    status: row.status,
    summary: row.summary,
    location: row.location,
    length: row.length,
    deadline: row.deadline,
    rate: row.compensation,
    description: row.description,
  };
}

/** Who is looking at a pitch, as far as reading it and acting on it are concerned */
export type PitchViewer = {
  userId: string;
  roles: string[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isEditor = (viewer: PitchViewer | null | undefined): viewer is PitchViewer =>
  Boolean(viewer?.roles.includes('editor'));

/** The signed-in person's id and roles, or null before onboarding */
export async function loadPitchViewer(clerkId: string): Promise<PitchViewer | null> {
  const { rows } = await db.query<{ id: string; roles: string[] | null }>(
    `SELECT id, roles FROM users WHERE clerk_id = $1`,
    [clerkId]
  );
  const row = rows[0];
  return row ? { userId: row.id, roles: row.roles ?? [] } : null;
}

/** Every pitch sent to this editor, newest first */
export async function listPitchesForEditor(editorUserId: string): Promise<Pitch[]> {
  const { rows } = await db.query<PitchRow>(
    `SELECT ${PITCH_COLUMNS}
     ${PITCH_FROM}
     WHERE p.target_editor_user_id = $1
     ORDER BY p.submitted_at DESC`,
    [editorUserId]
  );
  return rows.map(toPitch);
}

/** Every pitch this freelancer has sent, newest first */
export async function listPitchesForFreelancer(freelancerUserId: string): Promise<Pitch[]> {
  const { rows } = await db.query<PitchRow>(
    `SELECT ${PITCH_COLUMNS}
     ${PITCH_FROM}
     WHERE p.freelancer_user_id = $1
     ORDER BY p.submitted_at DESC`,
    [freelancerUserId]
  );
  return rows.map(toPitch);
}

/** One pitch by id, or null when it does not exist (or the id is not a UUID) */
export async function getPitch(id: string): Promise<PitchRow | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const { rows } = await db.query<PitchRow>(
    `SELECT ${PITCH_COLUMNS}
     ${PITCH_FROM}
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** A pitch is visible to the editor it was sent to and to the freelancer who sent it */
export function canViewPitch(viewer: PitchViewer | null | undefined, pitch: PitchRow): boolean {
  if (!viewer) return false;
  return pitch.target_editor_user_id === viewer.userId || pitch.freelancer_user_id === viewer.userId;
}

/** Only the editor who received a pitch may change its status or leave feedback */
export function canEditPitch(viewer: PitchViewer | null | undefined, pitch: PitchRow): boolean {
  return isEditor(viewer) && canViewPitch(viewer, pitch);
}

/**
 * The account a composer address points at, or null when nobody with that email edits.
 * Emails are matched case-insensitively, since the composer is free text.
 */
export async function findEditorByEmail(email: string): Promise<string | null> {
  const { rows } = await db.query<{ id: string }>(
    `SELECT id
       FROM users
      WHERE lower(email) = lower($1) AND 'editor' = ANY(roles)
      LIMIT 1`,
    [email.trim()]
  );
  return rows[0]?.id ?? null;
}

/** The fields a freelancer fills in when submitting a pitch */
export type NewPitch = {
  targetEditorUserId: string;
  slug: string;
  category: string;
  tags?: string[];
  summary: string;
  description: string;
  location: string;
  length: string;
  deadline: string;
  compensation: string;
};

/**
 * Saves a submitted pitch and reads it back with the freelancer's name filled in.
 * Returns null when this freelancer already sent the same slug to the same editor.
 */
export async function createPitch(freelancerUserId: string, pitch: NewPitch): Promise<Pitch | null> {
  let inserted: { id: string };

  try {
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO pitches (
         freelancer_user_id, target_editor_user_id, slug, category, tags, summary,
         description, location, length, deadline, compensation
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        freelancerUserId,
        pitch.targetEditorUserId,
        pitch.slug,
        pitch.category,
        pitch.tags ?? [],
        pitch.summary,
        pitch.description,
        pitch.location,
        pitch.length,
        pitch.deadline,
        pitch.compensation,
      ]
    );
    inserted = rows[0];
  } catch (error) {
    // 23505 = unique violation on (freelancer, editor, slug)
    if ((error as { code?: string }).code === '23505') return null;
    throw error;
  }

  const row = await getPitch(inserted.id);
  return row ? toPitch(row) : null;
}

/** The status a decision puts the pitch in; mirrors what the desk's PitchActions shows */
export const STATUS_FOR_DECISION: Record<PitchFeedback['decision'], PitchStatus> = {
  accepted: 'accepted',
  rejected: 'declined',
  revision_requested: 'negotiating',
};

/** Moves a pitch along the desk's review. Returns false when the id matches no pitch. */
export async function setPitchStatus(pitchId: string, status: PitchStatus): Promise<boolean> {
  if (!UUID_PATTERN.test(pitchId)) return false;

  const result = await db.query(
    `UPDATE pitches
        SET status = $2, updated_at = NOW()
      WHERE id = $1`,
    [pitchId, status]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Stores the editor's decision + notes and moves the pitch to the matching status */
export async function saveFeedback(pitchId: string, feedback: PitchFeedback): Promise<boolean> {
  if (!UUID_PATTERN.test(pitchId)) return false;

  const result = await db.query(
    `UPDATE pitches
        SET feedback = $2::jsonb,
            feedback_at = NOW(),
            status = $3,
            updated_at = NOW()
      WHERE id = $1`,
    [pitchId, JSON.stringify(feedback), STATUS_FOR_DECISION[feedback.decision]]
  );
  return (result.rowCount ?? 0) > 0;
}
