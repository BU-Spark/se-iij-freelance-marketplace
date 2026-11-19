import { db } from './db';
import { pitchHeading } from '../app/utils/pitch.utils';
import type { FlagReport, FlagStatus, FlagTarget } from '../app/types/admin.types';

/** A flag's target, as the report route needs to label it and check who owns it */
type FlagTargetRow = {
  label: string;
  ownerUserId: string | null;
};

type FlagRow = {
  id: string;
  target_type: FlagTarget;
  target_id: string;
  target_label: string;
  reason: string;
  reporter_name: string;
  status: FlagStatus;
  created_at: string | Date;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toFlagReport = (row: FlagRow): FlagReport => ({
  id: row.id,
  targetType: row.target_type,
  targetId: row.target_id,
  targetLabel: row.target_label,
  reason: row.reason,
  reporterName: row.reporter_name,
  status: row.status,
  createdAt: isoString(row.created_at),
});

/**
 * Resolves a flag's target to the label the queue shows and the account that owns it, or null when
 * the target no longer exists. Labels are read from the database, never from the report request.
 */
export async function loadFlagTarget(targetType: FlagTarget, targetId: string): Promise<FlagTargetRow | null> {
  if (!UUID_PATTERN.test(targetId)) return null;

  if (targetType === 'account') {
    const result = await db.query<{ id: string; name: string | null; email: string }>(
      `SELECT id, TRIM(first_name || ' ' || last_name) AS name, email
         FROM users
        WHERE id = $1`,
      [targetId]
    );
    const row = result.rows[0];
    return row ? { label: row.name || row.email, ownerUserId: row.id } : null;
  }

  if (targetType === 'assignment') {
    const result = await db.query<{ title: string; created_by_user_id: string }>(
      `SELECT title, created_by_user_id
         FROM assignments
        WHERE id = $1`,
      [targetId]
    );
    const row = result.rows[0];
    return row ? { label: row.title, ownerUserId: row.created_by_user_id } : null;
  }

  const result = await db.query<{ slug: string; freelancer_user_id: string }>(
    `SELECT slug, freelancer_user_id
       FROM pitches
      WHERE id = $1`,
    [targetId]
  );
  const row = result.rows[0];
  return row ? { label: pitchHeading(row.slug), ownerUserId: row.freelancer_user_id } : null;
}

export type SubmitFlagResult =
  | { status: 'recorded'; duplicate: boolean }
  | { status: 'not-onboarded' }
  | { status: 'not-found' }
  | { status: 'own' };

/**
 * Records a flag from a signed-in person. The reporter comes from the session, so the queue names a
 * real account; the target must still exist, and reports are deduplicated while one is waiting.
 */
export async function submitFlag({
  reporterClerkId,
  targetType,
  targetId,
  reason,
}: {
  reporterClerkId: string;
  targetType: FlagTarget;
  targetId: string;
  reason: string;
}): Promise<SubmitFlagResult> {
  const reporter = await db.query<{ id: string; name: string | null; email: string }>(
    `SELECT id, TRIM(first_name || ' ' || last_name) AS name, email
       FROM users
      WHERE clerk_id = $1`,
    [reporterClerkId]
  );
  const me = reporter.rows[0];
  if (!me) return { status: 'not-onboarded' };

  const target = await loadFlagTarget(targetType, targetId);
  if (!target) return { status: 'not-found' };
  if (target.ownerUserId === me.id) return { status: 'own' };

  const inserted = await db.query(
    `INSERT INTO content_flags (target_type, target_id, target_label, reason, reporter_user_id, reporter_name)
     SELECT $1, $2, $3, $4, $5, $6
      WHERE NOT EXISTS (
        SELECT 1
          FROM content_flags
         WHERE reporter_user_id = $5
           AND target_type = $1
           AND target_id = $2
           AND status IN ('open', 'reviewing')
      )`,
    [targetType, targetId, target.label, reason, me.id, me.name || me.email]
  );

  return { status: 'recorded', duplicate: (inserted.rowCount ?? 0) === 0 };
}

/** Every flag for the admin inbox, newest first. Capped so a long history stays a small payload. */
export async function listFlags(): Promise<FlagReport[]> {
  const result = await db.query<FlagRow>(
    `SELECT id, target_type, target_id, target_label, reason, reporter_name, status, created_at
       FROM content_flags
      ORDER BY created_at DESC
      LIMIT 200`
  );

  return result.rows.map(toFlagReport);
}

/** Moves a flag along the team's queue; null when the id is not a flag */
export async function setFlagStatus(id: string, status: FlagStatus): Promise<FlagReport | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const result = await db.query<FlagRow>(
    `UPDATE content_flags
        SET status = $2,
            updated_at = NOW()
      WHERE id = $1
      RETURNING id, target_type, target_id, target_label, reason, reporter_name, status, created_at`,
    [id, status]
  );

  return result.rows[0] ? toFlagReport(result.rows[0]) : null;
}
