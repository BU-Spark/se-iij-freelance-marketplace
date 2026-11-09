import VerificationList from './VerificationList';
import { VERIFICATION_REQUESTS } from './constants';

export default function VerificationPage() {
  return <VerificationList requests={VERIFICATION_REQUESTS} />;
}
