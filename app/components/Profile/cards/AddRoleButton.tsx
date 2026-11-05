import Link from 'next/link';
import { ROLE_CONFIG } from '../config/roleConfig';
import type { ProfileRole } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type AddRoleButtonProps = {
  role: ProfileRole;
};

/**
 * Adding a role is an onboarding job — it needs that role's whole step. So this is a link into
 * onboarding rather than an inline form, and onboarding reopens on the saved profile.
 */
export default function AddRoleButton({ role }: AddRoleButtonProps) {
  return (
    <Link href={`/onboarding?add=${role}`} className={styles.add}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
      Add the {ROLE_CONFIG[role].label.toLowerCase()} role
    </Link>
  );
}
