'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { ProfileRole } from '../../types';
import HamburgerMenu from '../NavMenu/HamburgerMenu';
import ProfileButton from '../Profile/ProfileButton';
import { useProfile } from '../../hooks/useProfile';
import { fullName } from '../../utils/profile.utils';
import styles from './editorHeader.module.css';

export function EditorHeader() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { profile } = useProfile();

  const myName = profile ? fullName(profile) : '';
  const myRoles: ProfileRole[] = profile?.roles.map((r) => r.role) ?? [];

  // people can switch which side of the desk they are working as; editors land on the desk by default
  const [workingAs, setWorkingAs] = useState<ProfileRole | null>(null);
  const defaultRole: ProfileRole = myRoles.includes('editor') ? 'editor' : (myRoles[0] ?? 'editor');
  const role = workingAs ?? defaultRole;

  return (
    <header className={styles.headerBox}>
      {/* ☰ opens the navigation menu on the left */}
      <HamburgerMenu
        name={myName}
        roles={myRoles}
        activeRole={role}
        onRoleChange={setWorkingAs}
        currentPath={pathname}
        profileHref={`${pathname}?panel=profile`}
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
          <button className={styles.newAssignment} type="button">
            {/* To Do: Replace ! with idea icon */}
            <span aria-hidden="true">!</span>
            Make a Pitch
          </button>
        )}

        {/* avatar that opens My profile (?panel=profile) */}
        <ProfileButton name={myName} />
      </div>
    </header>
  );
}
