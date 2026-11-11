import dotenv from 'dotenv';

// .env.local first: that is where a live (production) Clerk key would go, overriding .env
dotenv.config({ path: ['.env.local', '.env'], quiet: true });

/**
 * Grants or revokes the Story Match admin role for one Clerk user, found by email.
 *
 *   node scripts/make-admin.mjs priya@example.com
 *   node scripts/make-admin.mjs priya@example.com --revoke
 *   node scripts/make-admin.mjs priya@example.com --dry-run
 *
 * Admin is Clerk `public_metadata.role = 'admin'` (the app also accepts a `roles` array), which is
 * what middleware.ts and lib/auth.ts read. Point CLERK_SECRET_KEY at whichever instance the person
 * signed up in: a test key only sees test users, a live key only sees live ones.
 */

const args = process.argv.slice(2);
const email = args
  .find((arg) => !arg.startsWith('--'))
  ?.trim()
  .toLowerCase();
const revoke = args.includes('--revoke');
const dryRun = args.includes('--dry-run');
const key = process.env.CLERK_SECRET_KEY;

if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email> [--revoke|--dry-run]');
  process.exit(1);
}

if (!key) {
  console.error('CLERK_SECRET_KEY is not set. Add it to .env (or .env.local) and try again.');
  process.exit(1);
}

const instance = key.startsWith('sk_live') ? 'live' : key.startsWith('sk_test') ? 'test' : 'unknown';

const api = async (path, init = {}) => {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const reason = Array.isArray(body?.errors) ? body.errors.map((error) => error.message).join('; ') : response.status;
    throw new Error(`${init.method ?? 'GET'} ${path} failed: ${reason}`);
  }

  return body;
};

const emailsOf = (user) =>
  (user.email_addresses ?? []).map((address) => (address.email_address ?? '').toLowerCase()).filter(Boolean);

/** Clerk's `query` search misses some stored addresses, so walk the list and compare exactly */
async function findUsersByEmail(target) {
  const matches = [];
  const pageSize = 100;

  for (let offset = 0; offset <= 10_000; offset += pageSize) {
    const page = await api(`/users?limit=${pageSize}&offset=${offset}`);
    if (!Array.isArray(page) || page.length === 0) break;

    matches.push(...page.filter((user) => emailsOf(user).includes(target)));
    if (page.length < pageSize) break;
  }

  return matches;
}

(async () => {
  console.log(`Clerk instance: ${instance}`);

  const users = await findUsersByEmail(email);

  if (users.length === 0) {
    console.error(`No ${instance} Clerk user has the email ${email}. Nothing was changed.`);
    process.exit(2);
  }

  if (users.length > 1) {
    console.error(`More than one user has ${email}; refusing to guess. Nothing was changed:`);
    users.forEach((user) => console.error(`  ${user.id}  ${emailsOf(user).join(', ')}`));
    process.exit(3);
  }

  const user = users[0];
  const before = user.public_metadata ?? {};

  const after = revoke
    ? {
        ...before,
        ...(before.role === 'admin' ? { role: undefined } : {}),
        ...(Array.isArray(before.roles) ? { roles: before.roles.filter((role) => role !== 'admin') } : {}),
      }
    : { ...before, role: 'admin' };

  if (revoke) {
    Object.keys(after).forEach((name) => after[name] === undefined && delete after[name]);
  }

  console.log(`User:   ${user.id}  (${emailsOf(user).join(', ')})`);
  console.log(`Before: ${JSON.stringify(before)}`);
  console.log(`After:  ${JSON.stringify(after)}`);

  if (dryRun) {
    console.log('Dry run: nothing was sent to Clerk.');
    return;
  }

  const updated = await api(`/users/${user.id}/metadata`, {
    method: 'PATCH',
    body: JSON.stringify({ public_metadata: after }),
  });

  console.log(`Saved:  ${JSON.stringify(updated.public_metadata ?? {})}`);
  console.log(
    revoke
      ? 'Admin revoked. They land on /dashboard next time they sign in.'
      : 'Admin granted. They land on /admin next time they sign in.'
  );
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
