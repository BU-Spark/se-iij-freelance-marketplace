'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePanel from './ProfilePanel';
import { MOCK_PROFILE } from './constants';
import type { ProfileRole } from '../../types/profile.types';

type ProfileFromUrlProps = {
  closeHref: string;
};

/** Shows My profile when the URL has ?panel=profile */
export default function ProfileFromUrl({ closeHref }: ProfileFromUrlProps) {
  const params = useSearchParams();
  const router = useRouter();
  // TODO: load the signed-in user's profile from the API, and save added roles
  const [profile, setProfile] = useState(MOCK_PROFILE);

  if (params.get('panel') !== 'profile') return null;

  // adds an empty card for the new role, to be filled in when editing exists
  const addRole = (role: ProfileRole) =>
    setProfile((p) => ({ ...p, roles: [...p.roles, { role, bio: '', facts: {} }] }));

  return (
    <ProfilePanel profile={profile} onClose={() => router.push(closeHref, { scroll: false })} onAddRole={addRole} />
  );
}
