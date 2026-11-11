'use client';

import SidePanel from '../SidePanel/SidePanel';
import ProfileContent from './ProfileContent';
import type { AccountProfile, BasicInfo, RoleDetails } from '../../types/profile.types';

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

/** The quick view from the header avatar; the settings page shows the same cards expanded */
export default function ProfilePanel({
  profile,
  onClose,
  onSaveBasic,
  onSaveRole,
  onSaveAvailable,
}: ProfilePanelProps) {
  return (
    <SidePanel title="My profile" side="right" onClose={onClose}>
      <ProfileContent
        profile={profile}
        onSaveBasic={onSaveBasic}
        onSaveRole={onSaveRole}
        onSaveAvailable={onSaveAvailable}
      />
    </SidePanel>
  );
}
