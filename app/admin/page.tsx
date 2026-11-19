import { listOpenAppeals, type Appeal } from '../../lib/appeals';
import { listFlags } from '../../lib/flags';
import AdminInbox from './AdminInbox';
import type { FlagReport } from '../types/admin.types';

export const dynamic = 'force-dynamic';

/** One inbox for the team: appeals waiting for a second look, and flags raised across the marketplace. */
export default async function AdminInboxPage() {
  let appeals: Appeal[] = [];
  let flags: FlagReport[] = [];

  try {
    appeals = await listOpenAppeals();
  } catch (error) {
    console.error('Failed to load the appeals.', error);
  }

  try {
    flags = await listFlags();
  } catch (error) {
    console.error('Failed to load the flags.', error);
  }

  return <AdminInbox appeals={appeals} reports={flags} />;
}
