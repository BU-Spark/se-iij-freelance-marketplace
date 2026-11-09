'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import BasicInfoCard from './cards/BasicInfoCard';
import BasicInfoForm from './forms/BasicInfoForm';
import RoleCard from './cards/RoleCard';
import RoleForm from './forms/RoleForm';
import AddRoleButton from './cards/AddRoleButton';
import { ALL_ROLES, ROLE_CONFIG, isFilled, profileCompletion, requiredFieldsFor } from './config/roleConfig';
import { missingRoles } from '../../utils/profile.utils';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import styles from './Profile.module.css';

/** Saves resolve true once the server has the change, so a failed save leaves the form open */
type SaveResult = Promise<boolean> | boolean;

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, basic info gets an Edit button */
  onSaveBasic?: (basic: BasicInfo) => SaveResult;
  /** if given, each role card gets an Edit button */
  onSaveRole?: (details: RoleDetails) => SaveResult;
  /** if given, basic info gets the "free right now" switch */
  onSaveAvailable?: (availableNow: boolean) => SaveResult;
};

export default function ProfilePanel({
  profile,
  onClose,
  onSaveBasic,
  onSaveRole,
  onSaveAvailable,
}: ProfilePanelProps) {
  // which card is open as a form: 'basic', a role, or nothing
  const [editing, setEditing] = useState<'basic' | ProfileRole | null>(null);
  const stopEditing = () => setEditing(null);

  const unfinished = profile.roles
    .map((details) => ({
      role: details.role,
      missing: requiredFieldsFor(details.role).filter((field) => !isFilled(details.facts[field.key])),
    }))
    .filter((entry) => entry.missing.length > 0);

  // hidden once there is nothing left to fill in
  const completion = profileCompletion(profile);

  const saveBasic = async (basic: BasicInfo) => {
    if ((await onSaveBasic?.(basic)) === true) stopEditing();
  };

  const saveRole = async (details: RoleDetails) => {
    if ((await onSaveRole?.(details)) === true) stopEditing();
  };

  return (
    <SidePanel title="My profile" side="right" onClose={onClose}>
      <div className={styles.stack}>
        {completion < 100 && (
          <section className={styles.completion} aria-label="Profile completion">
            <p className={styles.completionHead}>
              <span>Profile completion</span>
              <strong>{completion}%</strong>
            </p>
            <div
              className={styles.completionTrack}
              role="progressbar"
              aria-label="Profile completion"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.completionFill} style={{ width: `${completion}%` }} />
            </div>
            <p className={styles.completionHint}>Fill in the rest so editors and freelancers can find you.</p>
          </section>
        )}

        {editing === 'basic' && onSaveBasic ? (
          <BasicInfoForm basic={profile.basic} onSave={saveBasic} onCancel={stopEditing} />
        ) : (
          <BasicInfoCard
            basic={profile.basic}
            onEdit={onSaveBasic && (() => setEditing('basic'))}
            onToggleAvailable={onSaveAvailable && ((next) => void onSaveAvailable(next))}
          />
        )}

        <h3 className={styles.label}>My roles</h3>

        {profile.roles.length === 0 && (
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

        {/* adding a role needs its own onboarding steps, so these link there */}
        {missingRoles(profile, ALL_ROLES).map((role) => (
          <AddRoleButton key={role} role={role} />
        ))}
      </div>
    </SidePanel>
  );
}
