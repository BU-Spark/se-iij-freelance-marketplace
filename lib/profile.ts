import { db } from './db';

/** True once onboarding has written the signed-in user's row */
export async function hasProfile(clerkId: string): Promise<boolean> {
  const result = await db.query('SELECT 1 FROM users WHERE clerk_id = $1', [clerkId]);
  return Boolean(result.rowCount);
}
