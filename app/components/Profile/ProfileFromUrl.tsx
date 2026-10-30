'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './config/constants';
import type { EditableBasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import { useToast } from '../Toast/ToastProvider';
type ProfileFromUrlProps = {
  closeHref: string;
};

/** Shows My profile when the URL has ?panel=profile */
export default function ProfileFromUrl({ closeHref }: ProfileFromUrlProps) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  // TODO: load the signed-in user's profile from the API, and save added roles
  const [profile, setProfile] = useState(MOCK_PROFILE);

  if (params.get('panel') !== 'profile') return null;

  // adds an empty card for the new role, to be filled in when editing exists
  const addRole = (role: ProfileRole) => {
    setProfile((p) => ({ ...p, roles: [...p.roles, { role, bio: '', facts: {} }] }));
    showToast(`${role === 'editor' ? 'Editor' : 'Freelancer'} role added`);
  };
  const saveBasic = (basic: EditableBasicInfo) => {
    setProfile((p) => ({ ...p, basic: { ...p.basic, ...basic } }));
    showToast('Profile saved');
  };
  const saveRole = (details: RoleDetails) => {
    setProfile((p) => ({ ...p, roles: p.roles.map((r) => (r.role === details.role ? details : r)) }));
    showToast('Role details saved');
  };

  return (
    <ProfilePanel
      profile={profile}
      onClose={() => router.push(closeHref, { scroll: false })}
      onAddRole={addRole}
      onSaveBasic={saveBasic}
      onSaveRole={saveRole}
    />
  );
}
