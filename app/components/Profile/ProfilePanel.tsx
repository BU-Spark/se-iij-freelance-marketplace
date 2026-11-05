'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import BasicInfoCard from './cards/BasicInfoCard';
import BasicInfoForm from './forms/BasicInfoForm';
import RoleCard from './cards/RoleCard';
import RoleForm from './forms/RoleForm';
import AddRoleButton from './cards/AddRoleButton';
import { ALL_ROLES, ROLE_CONFIG, requiredFieldsFor } from './config/roleConfig';
import { missingRoles } from '../../utils/profile.utils';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails, RoleValue } from '../../types/profile.types';
import styles from './Profile.module.css';

/** Saves resolve true once the server has the change, so a failed save leaves the form open */
type SaveResult = Promise<boolean> | boolean;

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, shows "Add the … role" for each role the person doesn't have */
  onAddRole?: (role: ProfileRole) => SaveResult;
  /** if given, basic info gets an Edit button */
  onSaveBasic?: (basic: BasicInfo) => SaveResult;
  /** if given, each role card gets an Edit button */
  onSaveRole?: (details: RoleDetails) => SaveResult;
};

/** Empty text, or a chip list with nothing picked */
const isBlank = (value: RoleValue | undefined) =>
  value === undefined || (Array.isArray(value) ? value.length === 0 : String(value).trim() === '');

export default function ProfilePanel({ profile, onClose, onAddRole, onSaveBasic, onSaveRole }: ProfilePanelProps) {
  // which card is open as a form: 'basic', a role, or nothing
  const [editing, setEditing] = useState<'basic' | ProfileRole | null>(null);
  const stopEditing = () => setEditing(null);

  const unfinished = profile.roles
    .map((details) => ({
      role: details.role,
      missing: requiredFieldsFor(details.role).filter((field) => isBlank(details.facts[field.key])),
    }))
    .filter((entry) => entry.missing.length > 0);

  const saveBasic = async (basic: BasicInfo) => {
    if ((await onSaveBasic?.(basic)) === true) stopEditing();
  };

  const saveRole = async (details: RoleDetails) => {
    if ((await onSaveRole?.(details)) === true) stopEditing();
  };

  // the new role's form only opens once the role exists, so it is never edited from a stale list
  const addRole = async (role: ProfileRole) => {
    if ((await onAddRole?.(role)) === true && onSaveRole) setEditing(role);
  };

  return (
    <SidePanel title="My profile" side="right" onClose={onClose}>
      <div className={styles.stack}>
        {editing === 'basic' && onSaveBasic ? (
          <BasicInfoForm basic={profile.basic} onSave={saveBasic} onCancel={stopEditing} />
        ) : (
          <BasicInfoCard basic={profile.basic} onEdit={onSaveBasic && (() => setEditing('basic'))} />
        )}

        <h3 className={styles.label}>My roles</h3>

        {profile.roles.length === 0 && onAddRole && (
          <p className={styles.notice}>
            Your profile isn&apos;t finished yet. Add the role you work as below and you&apos;re done.
          </p>
        )}
        {unfinished.map(({ role, missing }) => (
          <p key={role} className={styles.notice}>
            Finish your {ROLE_CONFIG[role].label.toLowerCase()} profile: add{' '}
            {missing.map((field) => `a ${field.label.toLowerCase()}`).join(' and ')}.
          </p>
        ))}
        {profile.roles.map((r) =>
          editing === r.role && onSaveRole ? (
            <RoleForm key={r.role} details={r} onSave={saveRole} onCancel={stopEditing} />
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
