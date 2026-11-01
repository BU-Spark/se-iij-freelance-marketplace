'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { ProfileRole } from '../../types';
import HamburgerMenu from '../NavMenu/HamburgerMenu';
import ProfileButton from '../Profile/ProfileButton';
import { MOCK_PROFILE } from '../Profile/config/constants';
import { fullName } from '../../utils/profile.utils';
import styles from './editorHeader.module.css';

// To do: replace MOCK_PROFILE with the signed-in user's profile from the API
const MY_NAME = fullName(MOCK_PROFILE);
const MY_ROLES: ProfileRole[] = MOCK_PROFILE.roles.map((r) => r.role);
const DEFAULT_ROLE: ProfileRole = MY_ROLES.includes('editor') ? 'editor' : MY_ROLES[0];

// To do: replace with the real count of new pitches
const BADGES = { pitches: 2 };

export function EditorHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const [role, setRole] = useState<ProfileRole>(DEFAULT_ROLE);

  return (
    <header className={styles.headerBox}>
      {/* ☰ opens the navigation menu on the left */}
      <HamburgerMenu
        name={MY_NAME}
        roles={MY_ROLES}
        activeRole={role}
        onRoleChange={(nextRole) => {
          setRole(nextRole);
          if (nextRole === 'freelancer') router.push('/dashboard/freelancer');
        }}
        currentPath={pathname}
        profileHref={`${pathname}?panel=profile`}
        badges={BADGES}
        onSignOut={() => signOut({ redirectUrl: '/' })}
      />

      <div className={styles.actions}>
        {role === 'editor' ? (
          // Opens the New Assignment drawer on the dashboard (?new=assignment)
          <Link className={styles.newAssignment} href="/dashboard?new=assignment">
            <span aria-hidden="true">+</span>
            New Assignment
          </Link>
        ) : (
          <Link className={styles.newAssignment} href="/dashboard/freelancer/make-a-pitch">
            Make a Pitch
          </Link>
        )}

        {/* avatar that opens My profile (?panel=profile) */}
        <ProfileButton name={MY_NAME} />
      </div>
    </header>
  );
}
