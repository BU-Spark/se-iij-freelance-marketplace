import { currentUser } from '@clerk/nextjs/server';

/**
 * Admin is not a marketplace role (the database only knows editor and freelancer), so it lives in
 * the Clerk user's public metadata as `{ role: 'admin' }` or `{ roles: ['admin'] }`.
 */
export const ADMIN_ROLE = 'admin';

/** The bit of a Clerk user we need: public metadata survives every sign-in */
type WithPublicMetadata = { publicMetadata?: unknown };

const isAdminValue = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().toLowerCase() === ADMIN_ROLE;

/** True when public metadata lists admin, either as a single role or inside a roles array */
export function isAdminMetadata(publicMetadata: unknown): boolean {
  if (typeof publicMetadata !== 'object' || publicMetadata === null) return false;

  const { role, roles } = publicMetadata as { role?: unknown; roles?: unknown };
  const listed = Array.isArray(roles) ? roles : [];

  return isAdminValue(role) || listed.some(isAdminValue);
}

export function isAdminUser(user: WithPublicMetadata | null | undefined): boolean {
  return isAdminMetadata(user?.publicMetadata);
}

/** Where a signed-in person belongs: the admin area for the team, the app for everyone else */
export function landingPathFor(user: WithPublicMetadata | null | undefined): '/admin' | '/dashboard' {
  return isAdminUser(user) ? '/admin' : '/dashboard';
}

/** Reads the signed-in person's role from Clerk. Server code only. */
export async function isSignedInUserAdmin(): Promise<boolean> {
  return isAdminUser(await currentUser());
}
