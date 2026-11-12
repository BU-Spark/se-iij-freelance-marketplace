'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Avatar from '../Avatar/Avatar';
import ProfileFromUrl from './ProfileFromUrl';
import { useProfile } from '../../hooks/useProfile';
import { fullName } from '../../utils/profile.utils';
import styles from './ProfileButton.module.css';

type ProfileButtonProps = {
  /** overrides the name shown on the avatar; defaults to the signed-in user's */
  name?: string;
  size?: number;
};

/**
 * Avatar that opens My profile on the current page (?panel=profile).
 * Self-contained so any header can drop it in: it also renders the panel.
 */
export default function ProfileButton({ name, size = 40 }: ProfileButtonProps) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const label = name ?? (profile ? fullName(profile) : '');

  return (
    <>
      <Link href={`${pathname}?panel=profile`} scroll={false} className={styles.avatar} aria-label="Open my profile">
        <Avatar name={label} size={size} src={profile?.basic.photoUrl} available={profile?.basic.availableNow} />
      </Link>

      {/* the profile panel itself; Suspense is required because it reads the URL */}
      <Suspense fallback={null}>
        <ProfileFromUrl closeHref={pathname} />
      </Suspense>
    </>
  );
}
