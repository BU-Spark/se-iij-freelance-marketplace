import { ROLE_CONFIG } from './roleConfig';
import type { ProfileRole } from '../../types/profile.types';
import styles from './Profile.module.css';

type AddRoleButtonProps = {
  role: ProfileRole;
  onAdd: (role: ProfileRole) => void;
};

export default function AddRoleButton({ role, onAdd }: AddRoleButtonProps) {
  return (
    <button type="button" className={styles.add} onClick={() => onAdd(role)}>
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
    </button>
  );
}
