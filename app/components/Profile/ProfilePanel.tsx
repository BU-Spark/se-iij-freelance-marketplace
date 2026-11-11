'use client';

import { useState } from 'react';
import SidePanel from '../SidePanel/SidePanel';
import ProfileContent from './ProfileContent';
import ProfileHero from './cards/ProfileHero';
import RoleDrawer from './RoleDrawer';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';

/** Saves resolve true once the server has the change, so a failed save leaves the form open */
type SaveResult = Promise<boolean> | boolean;

type ProfilePanelProps = {
  profile: AccountProfile;
  onClose: () => void;
  /** if given, basic info gets an Edit button */
  onSaveBasic?: (basic: BasicInfo) => SaveResult;
  /** if given, each role's drawer gets an Edit button */
  onSaveRole?: (details: RoleDetails) => SaveResult;
  /** if given, basic info gets the "free right now" switch */
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
  const [openRole, setOpenRole] = useState<ProfileRole | null>(null);
  // read from the profile each render, so a save shows up in the open drawer straight away
  const openDetails = profile.roles.find((r) => r.role === openRole);

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
          onSaveBasic={onSaveBasic}
          onSaveAvailable={onSaveAvailable}
          onOpenRole={setOpenRole}
        />
      </SidePanel>

      {/* a sibling, not a child, so it is never clipped or moved by this panel's slide-in */}
      {openDetails && (
        <RoleDrawer
          key={openDetails.role}
          details={openDetails}
          onClose={() => setOpenRole(null)}
          onSave={onSaveRole}
        />
      )}
    </>
  );
}
