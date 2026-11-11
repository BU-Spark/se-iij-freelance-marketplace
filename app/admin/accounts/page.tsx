import { listAdminAccounts } from '../../../lib/accounts';
import type { AdminAccount } from '../../types/admin.types';
import AccountList from './AccountList';

// A suspension made a moment ago has to show up on the next visit
export const dynamic = 'force-dynamic';

/** Accounts live in the database; a load failure shows an empty tab rather than crashing the admin area. */
export default async function AccountsPage() {
  let accounts: AdminAccount[] = [];

  try {
    accounts = await listAdminAccounts();
  } catch (error) {
    console.error('Failed to load the accounts.', error);
  }

  return <AccountList accounts={accounts} />;
}
