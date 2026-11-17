import { db } from './db';
import type { RosterInviteStatus, RosterMember } from '../app/types/dashboard.types';
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
    u.available_now,
    u.available_until,
    f.location,
    f.beats,
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

/** A row from the editor's own roster query: the freelancer, plus how this editor's invite stands */
type EditorRosterRow = RosterRow & { invited_at: string | Date | null; status: RosterInviteStatus | null };

/**
 * The same freelancers, annotated with this editor's invite. A LEFT JOIN keeps everyone in the
 * result so the page can offer the rest as people still to invite.
 */
const SELECT_EDITOR_ROSTER = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.available_now,
    u.available_until,
    f.location,
    f.beats,
    f.beat_tags,
    f.work_mediums,
    f.availability,
    r.invited_at,
    r.status
  FROM users u
  JOIN freelancers f ON f.user_id = u.id
  LEFT JOIN roster_invites r
    ON r.freelancer_user_id = u.id
   AND r.editor_user_id = $1
  WHERE 'freelancer' = ANY(u.roles)
  ORDER BY u.first_name, u.last_name
`;

export type EditorRoster = {
  /** freelancers who accepted, with the date they were added */
  members: RosterMember[];
  /** invitations still waiting on an answer, or turned down */
  pending: RosterMember[];
  /** everyone else in the directory, who can still be invited */
  invitable: RosterMember[];
};

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

/** The signed-in person's own `users` id; null before onboarding has written their row */
async function userIdFor(clerkId: string): Promise<string | null> {
  const { rows } = await db.query<{ id: string }>('SELECT id FROM users WHERE clerk_id = $1', [clerkId]);
  return rows[0]?.id ?? null;
}

/**
 * Whose roster? The signed-in editor's, split into the people who accepted, the invitations still
 * waiting on an answer (or turned down), and the people who could still be invited.
 */
export async function loadEditorRoster(editorClerkId: string, now: Date = new Date()): Promise<EditorRoster> {
  const editorId = await userIdFor(editorClerkId);
  if (!editorId) return { members: [], pending: [], invitable: [] };

  const { rows } = await db.query<EditorRosterRow>(SELECT_EDITOR_ROSTER, [editorId]);

  const members: RosterMember[] = [];
  const pending: RosterMember[] = [];
  const invitable: RosterMember[] = [];

  for (const row of rows) {
    const member = toRosterMember(row, now);

    if (!row.invited_at || !row.status) {
      invitable.push(member);
    } else if (row.status === 'accepted') {
      members.push({ ...member, invitedAt: isoString(row.invited_at), inviteStatus: row.status });
    } else {
      pending.push({ ...member, invitedAt: isoString(row.invited_at), inviteStatus: row.status });
    }
  }

  return { members, pending, invitable };
}

/** The freelancer ids this editor has already invited, for marking the talent directory */
export async function listInvitedIds(editorClerkId: string): Promise<string[]> {
  const editorId = await userIdFor(editorClerkId);
  if (!editorId) return [];

  const { rows } = await db.query<{ freelancer_user_id: string }>(
    `SELECT freelancer_user_id
       FROM roster_invites
      WHERE editor_user_id = $1
        AND status <> 'declined'`,
    [editorId]
  );

  return rows.map((row) => row.freelancer_user_id);
}

export type InviteResult = {
  invited: { freelancerId: string; invitedAt: string; status: RosterInviteStatus }[];
};

/**
 * Asks freelancers to join this editor's roster. Only accounts that really hold the freelancer role
 * are taken, and the invite starts as pending until they answer. A declined invite can be asked
 * again (the same row reopens); an accepted one is left alone.
 * Returns null when the signed-in person has no `users` row yet.
 */
export async function inviteFreelancers(editorClerkId: string, freelancerIds: string[]): Promise<InviteResult | null> {
  const editorId = await userIdFor(editorClerkId);
  if (!editorId) return null;

  const { rows } = await db.query<{
    freelancer_user_id: string;
    invited_at: string | Date;
    status: RosterInviteStatus;
  }>(
    `INSERT INTO roster_invites (editor_user_id, freelancer_user_id)
     SELECT $1, u.id
       FROM users u
      WHERE u.id = ANY($2::uuid[])
        AND 'freelancer' = ANY(u.roles)
        AND u.id <> $1
     ON CONFLICT (editor_user_id, freelancer_user_id) DO UPDATE
        SET status = 'pending',
            invited_at = NOW(),
            responded_at = NULL
      WHERE roster_invites.status = 'declined'
     RETURNING freelancer_user_id, invited_at, status`,
    [editorId, freelancerIds]
  );

  return {
    invited: rows.map((row) => ({
      freelancerId: row.freelancer_user_id,
      invitedAt: isoString(row.invited_at),
      status: row.status,
    })),
  };
}

/**
 * Takes someone off the roster. True when a row was deleted, false when they were not on it,
 * null when the signed-in person has no `users` row yet.
 */
export async function removeFromRoster(editorClerkId: string, freelancerId: string): Promise<boolean | null> {
  const editorId = await userIdFor(editorClerkId);
  if (!editorId) return null;

  const result = await db.query(
    `DELETE FROM roster_invites
      WHERE editor_user_id = $1
        AND freelancer_user_id = $2`,
    [editorId, freelancerId]
  );

  return (result.rowCount ?? 0) > 0;
}

/** An invitation as the freelancer sees it: who asked, and whether they have answered */
export type RosterInvite = {
  /** the editor's `users` id; what the freelancer answers to */
  editorId: string;
  editorName: string;
  organizationId?: string;
  invitedAt: string;
  status: RosterInviteStatus;
};

type InviteRow = {
  editor_user_id: string;
  invited_at: string | Date;
  status: RosterInviteStatus;
  first_name: string | null;
  last_name: string | null;
  organization_id: string | null;
};

const SELECT_INVITES = `
  SELECT
    r.editor_user_id,
    r.invited_at,
    r.status,
    e.first_name,
    e.last_name,
    ed.organization_id
  FROM roster_invites r
  JOIN users e ON e.id = r.editor_user_id
  LEFT JOIN editors ed ON ed.user_id = e.id
  WHERE r.freelancer_user_id = $1
  ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.invited_at DESC
`;

/** Every editor who has asked this freelancer onto their roster, unanswered first */
export async function listInvitesForFreelancer(freelancerClerkId: string): Promise<RosterInvite[]> {
  const freelancerId = await userIdFor(freelancerClerkId);
  if (!freelancerId) return [];

  const { rows } = await db.query<InviteRow>(SELECT_INVITES, [freelancerId]);

  return rows.map((row) => {
    const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();

    return {
      editorId: row.editor_user_id,
      editorName: name || 'An editor',
      ...(row.organization_id ? { organizationId: row.organization_id } : {}),
      invitedAt: isoString(row.invited_at),
      status: row.status,
    };
  });
}

/**
 * Accepts or declines an invitation addressed to the signed-in freelancer. Only a pending invite can
 * be answered, so a second answer cannot overwrite the first.
 * True when it was answered, false when there was nothing pending, null when the person has no row.
 */
export async function respondToInvite(
  freelancerClerkId: string,
  editorId: string,
  response: Exclude<RosterInviteStatus, 'pending'>
): Promise<boolean | null> {
  const freelancerId = await userIdFor(freelancerClerkId);
  if (!freelancerId) return null;

  const result = await db.query(
    `UPDATE roster_invites
        SET status = $3,
            responded_at = NOW()
      WHERE editor_user_id = $1
        AND freelancer_user_id = $2
        AND status = 'pending'`,
    [editorId, freelancerId, response]
  );

  return (result.rowCount ?? 0) > 0;
}
