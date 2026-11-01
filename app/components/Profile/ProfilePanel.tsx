'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import BasicInfoCard from './BasicInfoCard';
import BasicInfoForm from './BasicInfoForm';
import RoleCard from './RoleCard';
import RoleForm from './RoleForm';
import AddRoleButton from './AddRoleButton';
import { ALL_ROLES } from './roleConfig';
import { missingRoles } from '../../utils/profile.utils';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import styles from './Profile.module.css';

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, shows "Add the … role" for each role the person doesn't have */
  onAddRole?: (role: ProfileRole) => void;
  /** if given, basic info gets an Edit button */
  onSaveBasic?: (basic: BasicInfo) => void;
  /** if given, each role card gets an Edit button */
  onSaveRole?: (details: RoleDetails) => void;
};

export default function ProfilePanel({ profile, onClose, onAddRole, onSaveBasic, onSaveRole }: ProfilePanelProps) {
  // which card is open as a form: 'basic', a role, or nothing
  const [editing, setEditing] = useState<'basic' | ProfileRole | null>(null);
  const stopEditing = () => setEditing(null);

  const addRole = (role: ProfileRole) => {
    onAddRole?.(role);
    // open the new role's form straight away so it can be filled in
    if (onSaveRole) setEditing(role);
  };

  return (
    <SidePanel title="My profile" side="right" onClose={onClose}>
      <div className={styles.stack}>
        {editing === 'basic' && onSaveBasic ? (
          <BasicInfoForm
            basic={profile.basic}
            onSave={(basic) => {
              onSaveBasic(basic);
              stopEditing();
            }}
            onCancel={stopEditing}
          />
        ) : (
          <BasicInfoCard basic={profile.basic} onEdit={onSaveBasic && (() => setEditing('basic'))} />
        )}

        <h3 className={styles.label}>My roles</h3>
        {profile.roles.map((r) =>
          editing === r.role && onSaveRole ? (
            <RoleForm
              key={r.role}
              details={r}
              onSave={(details) => {
                onSaveRole(details);
                stopEditing();
              }}
              onCancel={stopEditing}
            />
          ) : (
            <RoleCard key={r.role} details={r} onEdit={onSaveRole && (() => setEditing(r.role))} />
          )
        )}

        {onAddRole &&
          missingRoles(profile, ALL_ROLES).map((role) => <AddRoleButton key={role} role={role} onAdd={addRole} />)}
      </div>
    </SidePanel>
  );
}
