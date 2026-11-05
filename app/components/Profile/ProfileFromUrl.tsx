'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePanel from './ProfilePanel';
import SidePanel from '../SidePanel/SidePanel';
import { useToast } from '../Toast/ToastProvider';
import { useProfile } from '../../hooks/useProfile';
import type { BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import styles from './Profile.module.css';

type ProfileFromUrlProps = {
  closeHref: string;
};

const SAVE_FAILED = 'Could not save your profile. Please try again.';

/** Shows My profile when the URL has ?panel=profile */
export default function ProfileFromUrl({ closeHref }: ProfileFromUrlProps) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, loading, error, saveBasic, saveRole, addRole } = useProfile();

  if (params.get('panel') !== 'profile') return null;

  const close = () => router.push(closeHref, { scroll: false });

  if (!profile) {
    return (
      <SidePanel title="My profile" side="right" onClose={close}>
        <p className={styles.status} role="status">
          {loading ? 'Loading your profile…' : (error ?? 'Your profile is unavailable right now.')}
        </p>
      </SidePanel>
    );
  }

  const toast = (ok: boolean, saved: string) => showToast(ok ? saved : SAVE_FAILED, ok ? 'success' : 'error');

  const handleSaveBasic = async (basic: BasicInfo) => {
    const ok = await saveBasic(basic);
    toast(ok, 'Basic info saved');
    return ok;
  };

  const handleSaveRole = async (details: RoleDetails) => {
    const ok = await saveRole(details);
    toast(ok, 'Role details saved');
    return ok;
  };

  const handleAddRole = async (role: ProfileRole) => {
    const ok = await addRole(role);
    toast(ok, `${role === 'editor' ? 'Editor' : 'Freelancer'} role added`);
    return ok;
  };

  return (
    <ProfilePanel
      profile={profile}
      onClose={close}
      onAddRole={handleAddRole}
      onSaveBasic={handleSaveBasic}
      onSaveRole={handleSaveRole}
    />
  );
}
