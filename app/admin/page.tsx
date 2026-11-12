import { listOpenAppeals, type Appeal } from '../../lib/appeals';
import AdminInbox from './AdminInbox';
import { FLAG_REPORTS } from './constants';

export const dynamic = 'force-dynamic';

/** One inbox for the team: real appeals waiting for a second look, and flags (sample data for now). */
export default async function AdminInboxPage() {
  let appeals: Appeal[] = [];

  try {
    appeals = await listOpenAppeals();
  } catch (error) {
    console.error('Failed to load the appeals.', error);
  }

  return <AdminInbox appeals={appeals} reports={FLAG_REPORTS} />;
}
