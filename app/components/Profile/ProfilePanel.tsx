'use client';

import { useState } from 'react';
import Link from 'next/link';
import SidePanel from '../SidePanel/SidePanel';
import ProfileContent from './ProfileContent';
import ProfileHero from './cards/ProfileHero';
import BasicInfoDrawer from './BasicInfoDrawer';
import RoleDrawer from './RoleDrawer';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import styles from './Profile.module.css';

/** Saves resolve true once the server has the change, so a failed save leaves the form open */
type SaveResult = Promise<boolean> | boolean;

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, the Basic info drawer gets an Edit button */
  onSaveBasic?: (basic: BasicInfo) => SaveResult;
  /** if given, each role's drawer gets an Edit button */
  onSaveRole?: (details: RoleDetails) => SaveResult;
  /** if given, My profile shows the "free right now" switch */
  onSaveAvailable?: (availableNow: boolean) => SaveResult;
};

/** The quick view from the header avatar; the settings page shows the same cards expanded */
export default function ProfilePanel({
  profile,
  onClose,
  onSaveBasic,
  onSaveRole,
  onSaveAvailable,
}: ProfilePanelProps) {
  const [open, setOpen] = useState<'basic' | ProfileRole | null>(null);
  const close = () => setOpen(null);
  // read from the profile each render, so a save shows up in the open drawer straight away
  const openDetails = profile.roles.find((r) => r.role === open);

  return (
    <>
      <SidePanel
        title="My profile"
        side="right"
        tone="navy"
        header={<ProfileHero basic={profile.basic} />}
        onClose={onClose}
      >
        <ProfileContent
          profile={profile}
          onSaveAvailable={onSaveAvailable}
          onOpenBasic={() => setOpen('basic')}
          onOpenRole={setOpen}
        />
        <Link href="/dashboard/settings" className={styles.settingsLink}>
          Open settings →
        </Link>
      </SidePanel>

      {/* siblings, not children, so they are never clipped or moved by this panel's slide-in */}
      {open === 'basic' && <BasicInfoDrawer basic={profile.basic} onClose={close} onSave={onSaveBasic} />}
      {openDetails && <RoleDrawer key={openDetails.role} details={openDetails} onClose={close} onSave={onSaveRole} />}
    </>
  );
}
