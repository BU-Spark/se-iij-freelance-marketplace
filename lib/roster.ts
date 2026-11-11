import { db } from './db';
import type { RosterMember } from '../app/types/dashboard.types';
import { toRosterMember, type RosterRow } from '../app/utils/roster.utils';

/**
 * Every freelancer who has finished onboarding, with the answers the roster card shows.
 * The roles check matters because a role row outlives the role being unticked.
 */
const SELECT_FREELANCERS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    f.location,
    f.reporting_beats,
    f.beat_tags,
    f.work_mediums,
    f.availability
  FROM users u
  JOIN freelancers f ON f.user_id = u.id
  WHERE 'freelancer' = ANY(u.roles)
  ORDER BY u.first_name, u.last_name
`;

export async function listRoster(now: Date = new Date()): Promise<RosterMember[]> {
  const { rows } = await db.query<RosterRow>(SELECT_FREELANCERS);
  return rows.map((row) => toRosterMember(row, now));
}

/** A row from the editor's own roster query: the freelancer, plus when this editor invited them */
type EditorRosterRow = RosterRow & { invited_at: string | Date | null };

/**
 * The same freelancers, annotated with this editor's invite. A LEFT JOIN keeps everyone in the
 * result so the page can offer the rest as people still to invite.
 */
const SELECT_EDITOR_ROSTER = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    f.location,
    f.reporting_beats,
    f.beat_tags,
    f.work_mediums,
    f.availability,
    r.invited_at
  FROM users u
  JOIN freelancers f ON f.user_id = u.id
  LEFT JOIN roster_invites r
    ON r.freelancer_user_id = u.id
   AND r.editor_user_id = $1
  WHERE 'freelancer' = ANY(u.roles)
  ORDER BY u.first_name, u.last_name
`;

export type EditorRoster = {
  /** freelancers this editor has invited, with the date they were added */
  members: RosterMember[];
  /** everyone else in the directory, who can still be invited */
  invitable: RosterMember[];
};

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

/** The editor's own `users` id; null before onboarding has written their row */
async function editorIdFor(clerkId: string): Promise<string | null> {
  const { rows } = await db.query<{ id: string }>('SELECT id FROM users WHERE clerk_id = $1', [clerkId]);
  return rows[0]?.id ?? null;
}

/** Whose roster? The signed-in editor's, split into the people on it and the people who could be */
export async function loadEditorRoster(editorClerkId: string, now: Date = new Date()): Promise<EditorRoster> {
  const editorId = await editorIdFor(editorClerkId);
  if (!editorId) return { members: [], invitable: [] };

  const { rows } = await db.query<EditorRosterRow>(SELECT_EDITOR_ROSTER, [editorId]);

  const members: RosterMember[] = [];
  const invitable: RosterMember[] = [];

  for (const row of rows) {
    const member = toRosterMember(row, now);
    if (row.invited_at) members.push({ ...member, invitedAt: isoString(row.invited_at) });
    else invitable.push(member);
  }

  return { members, invitable };
}

/** The freelancer ids this editor has already invited, for marking the talent directory */
export async function listInvitedIds(editorClerkId: string): Promise<string[]> {
  const editorId = await editorIdFor(editorClerkId);
  if (!editorId) return [];

  const { rows } = await db.query<{ freelancer_user_id: string }>(
    `SELECT freelancer_user_id
       FROM roster_invites
      WHERE editor_user_id = $1`,
    [editorId]
  );

  return rows.map((row) => row.freelancer_user_id);
}

export type InviteResult = { invited: { freelancerId: string; invitedAt: string }[] };

/**
 * Adds freelancers to this editor's roster. Only accounts that really hold the freelancer role are
 * taken, and ids already on the roster are skipped rather than given a new date.
 * Returns null when the signed-in person has no `users` row yet.
 */
export async function inviteFreelancers(editorClerkId: string, freelancerIds: string[]): Promise<InviteResult | null> {
  const editorId = await editorIdFor(editorClerkId);
  if (!editorId) return null;

  const { rows } = await db.query<{ freelancer_user_id: string; invited_at: string | Date }>(
    `INSERT INTO roster_invites (editor_user_id, freelancer_user_id)
     SELECT $1, u.id
       FROM users u
      WHERE u.id = ANY($2::uuid[])
        AND 'freelancer' = ANY(u.roles)
        AND u.id <> $1
     ON CONFLICT DO NOTHING
     RETURNING freelancer_user_id, invited_at`,
    [editorId, freelancerIds]
  );

  return {
    invited: rows.map((row) => ({ freelancerId: row.freelancer_user_id, invitedAt: isoString(row.invited_at) })),
  };
}

/**
 * Takes someone off the roster. True when a row was deleted, false when they were not on it,
 * null when the signed-in person has no `users` row yet.
 */
export async function removeFromRoster(editorClerkId: string, freelancerId: string): Promise<boolean | null> {
  const editorId = await editorIdFor(editorClerkId);
  if (!editorId) return null;

  const result = await db.query(
    `DELETE FROM roster_invites
      WHERE editor_user_id = $1
        AND freelancer_user_id = $2`,
    [editorId, freelancerId]
  );

  return (result.rowCount ?? 0) > 0;
}
