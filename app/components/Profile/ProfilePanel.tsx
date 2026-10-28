import SidePanel from '../SidePanel/SidePanel';
import BasicInfoCard from './BasicInfoCard';
import RoleCard from './RoleCard';
import AddRoleButton from './AddRoleButton';
import { ALL_ROLES } from './roleConfig';
import { missingRoles } from '../../utils/profile.utils';
import type { AccountProfile, ProfileRole } from '../../types/profile.types';
import styles from './Profile.module.css';

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, shows "Add the … role" for each role the person doesn't have */
  onAddRole?: (role: ProfileRole) => void;
};

export default function ProfilePanel({ profile, onClose, onAddRole }: ProfilePanelProps) {
  return (
    <SidePanel title="My profile" side="right" onClose={onClose}>
      <div className={styles.stack}>
        <BasicInfoCard basic={profile.basic} />

        <h3 className={styles.label}>My roles</h3>
        {profile.roles.map((r) => (
          <RoleCard key={r.role} details={r} />
        ))}

        {onAddRole &&
          missingRoles(profile, ALL_ROLES).map((role) => <AddRoleButton key={role} role={role} onAdd={onAddRole} />)}
      </div>
    </SidePanel>
  );
}
