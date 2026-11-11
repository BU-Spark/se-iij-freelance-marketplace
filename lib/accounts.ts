import { clerkClient } from '@clerk/nextjs/server';
import { db } from './db';
import type { AdminAccount } from '../app/types/admin.types';

/**
 * One `users` row as the Accounts tab needs it. `clerk_id` is the handle Clerk knows the person by,
 * which is what a ban targets; everything else is for display.
 */
export type AccountRow = {
  id: string;
  clerk_id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  suspended_at: string | Date | null;
  suspension_reason: string | null;
  created_at: string | Date;
};

const ACCOUNT_COLUMNS = `
  u.id,
  u.clerk_id,
  u.email,
  u.first_name,
  u.last_name,
  u.roles,
  u.suspended_at,
  u.suspension_reason,
  u.created_at
`;

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

/** A database row as the Accounts tab shows it: suspended means "can no longer sign in" */
export function toAdminAccount(row: AccountRow): AdminAccount {
  const name = `${row.first_name} ${row.last_name}`.trim();

  return {
    id: row.id,
    name: name || row.email,
    email: row.email,
    // Admins are not marketplace users, so a row always holds editor, freelancer, or neither
    role: row.roles.includes('editor') ? 'editor' : 'freelancer',
    status: row.suspended_at ? 'suspended' : 'active',
    ...(row.suspended_at && row.suspension_reason ? { suspensionReason: row.suspension_reason } : {}),
    joinedAt: isoString(row.created_at),
  };
}

/** Everyone the team may look after, newest first */
export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const result = await db.query<AccountRow>(
    `SELECT ${ACCOUNT_COLUMNS}
       FROM users u
      ORDER BY u.created_at DESC`
  );

  return result.rows.map(toAdminAccount);
}

export async function getAccount(userId: string): Promise<AccountRow | null> {
  const result = await db.query<AccountRow>(
    `SELECT ${ACCOUNT_COLUMNS}
       FROM users u
      WHERE u.id = $1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

/**
 * Stops someone signing in and records why. The Clerk ban is the part that actually blocks access,
 * so it happens first: a row that says "suspended" while sign-in still works would be a lie.
 */
export async function suspendAccount(userId: string, reason: string): Promise<AdminAccount | null> {
  const account = await getAccount(userId);
  if (!account) return null;

  const client = await clerkClient();
  await client.users.banUser(account.clerk_id);

  try {
    const result = await db.query<AccountRow>(
      `UPDATE users u
          SET suspended_at = NOW(),
              suspension_reason = $2,
              updated_at = NOW()
        WHERE u.id = $1
        RETURNING ${ACCOUNT_COLUMNS}`,
      [account.id, reason]
    );

    return result.rows[0] ? toAdminAccount(result.rows[0]) : null;
  } catch (error) {
    // Never leave someone banned with no record of why; put their sign-in back and report the failure
    try {
      await (await clerkClient()).users.unbanUser(account.clerk_id);
    } catch (unbanError) {
      console.error('Could not lift the ban after the suspension failed to save.', unbanError);
    }

    throw error;
  }
}

/** Lets someone back in. The unban goes first so a stale row never keeps a person locked out. */
export async function reactivateAccount(userId: string): Promise<AdminAccount | null> {
  const account = await getAccount(userId);
  if (!account) return null;

  const client = await clerkClient();
  await client.users.unbanUser(account.clerk_id);

  const result = await db.query<AccountRow>(
    `UPDATE users u
        SET suspended_at = NULL,
            suspension_reason = NULL,
            updated_at = NOW()
      WHERE u.id = $1
      RETURNING ${ACCOUNT_COLUMNS}`,
    [account.id]
  );

  return result.rows[0] ? toAdminAccount(result.rows[0]) : null;
}
