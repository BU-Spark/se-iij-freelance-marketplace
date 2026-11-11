import { listOpenAppeals, type Appeal } from '../../lib/appeals';
import AdminInbox from './AdminInbox';
import AppealList from './AppealList';
import { FLAG_REPORTS } from './constants';

export const dynamic = 'force-dynamic';

/** Flags come from the sample data for now; appeals are real rows waiting for a second look. */
export default async function AdminInboxPage() {
  let appeals: Appeal[] = [];

  try {
    appeals = await listOpenAppeals();
  } catch (error) {
    console.error('Failed to load the appeals.', error);
  }

  return (
    <>
      <AppealList appeals={appeals} />
      <AdminInbox reports={FLAG_REPORTS} />
    </>
  );
}
