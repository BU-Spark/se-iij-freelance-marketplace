import { db } from './db';

/** Where an appeal sits in the Story Match team's queue */
export type AppealStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

/** One suspended person's request for a second look, as the admin area shows it */
export type Appeal = {
  id: string;
  /** the account the appeal is about; reactivating it is what closes the appeal */
  userId: string;
  name: string;
  email: string;
  message: string;
  /** why the team suspended them, so the reviewer has the context next to the appeal */
  suspensionReason?: string;
  status: AppealStatus;
  /** ISO timestamp */
  createdAt: string;
};

type AppealRow = {
  id: string;
  user_id: string | null;
  email: string;
  message: string;
  status: AppealStatus;
  created_at: string | Date;
  first_name: string | null;
  last_name: string | null;
  suspension_reason: string | null;
};

const isoString = (value: string | Date) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const toAppeal = (row: AppealRow): Appeal => {
  const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();

  return {
    id: row.id,
    userId: row.user_id ?? '',
    name: name || row.email,
    email: row.email,
    message: row.message,
    ...(row.suspension_reason ? { suspensionReason: row.suspension_reason } : {}),
    status: row.status,
    createdAt: isoString(row.created_at),
  };
};

/**
 * Records an appeal from a suspended person. The caller is told the same thing whether or not the
 * address belongs to a suspended account, so the form cannot be used to discover who has an account.
 * A second appeal while one is still open is ignored rather than piled up.
 */
export async function submitAppeal({ email, message }: { email: string; message: string }): Promise<void> {
  const found = await db.query<{ id: string }>(
    `SELECT id
       FROM users
      WHERE lower(email) = lower($1)
        AND suspended_at IS NOT NULL`,
    [email]
  );

  const account = found.rows[0];
  if (!account) return;

  await db.query(
    `INSERT INTO account_appeals (user_id, email, message)
     SELECT $1, lower($2), $3
      WHERE NOT EXISTS (
        SELECT 1
          FROM account_appeals
         WHERE user_id = $1
           AND status IN ('open', 'reviewing')
      )`,
    [account.id, email, message]
  );
}

/** Appeals the team has not settled yet, newest first */
export async function listOpenAppeals(): Promise<Appeal[]> {
  const result = await db.query<AppealRow>(
    `SELECT
       a.id,
       a.user_id,
       a.email,
       a.message,
       a.status,
       a.created_at,
       u.first_name,
       u.last_name,
       u.suspension_reason
     FROM account_appeals a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.status IN ('open', 'reviewing')
     ORDER BY a.created_at DESC`
  );

  return result.rows.map(toAppeal);
}

/** Reactivating an account settles its appeals: there is nothing left to decide */
export async function resolveAppeals(userId: string): Promise<void> {
  await db.query(
    `UPDATE account_appeals
        SET status = 'resolved',
            updated_at = NOW()
      WHERE user_id = $1
        AND status IN ('open', 'reviewing')`,
    [userId]
  );
}
