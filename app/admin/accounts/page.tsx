import AccountList from './AccountList';
import { ADMIN_ACCOUNTS } from './constants';

export default function AccountsPage() {
  return <AccountList accounts={ADMIN_ACCOUNTS} />;
}
