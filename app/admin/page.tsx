import AdminInbox from './AdminInbox';
import { FLAG_REPORTS } from './constants';

export default function AdminInboxPage() {
  return <AdminInbox reports={FLAG_REPORTS} />;
}
