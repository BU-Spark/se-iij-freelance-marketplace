'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { ProfileRole } from '../../types';
import HamburgerMenu from '../NavMenu/HamburgerMenu';
import ProfileButton from '../Profile/ProfileButton';
import { useProfile } from '../../hooks/useProfile';
import { fullName } from '../../utils/profile.utils';
import styles from './editorHeader.module.css';

// PR #141's shared header always offers both workspaces; profile roles are separate profile data.
const WORKSPACE_ROLES: ProfileRole[] = ['freelancer', 'editor'];

export function EditorHeader({ initialRole }: { initialRole?: ProfileRole } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useProfile();

  const myName = profile ? fullName(profile) : '';

  // people can switch which side of the desk they are working as; editors land on the desk by default
  const [workingAs, setWorkingAs] = useState<ProfileRole | null>(null);
  const role = workingAs ?? initialRole ?? 'editor';

  return (
    <header className={styles.headerBox}>
      {/* ☰ opens the navigation menu on the left */}
      <HamburgerMenu
        name={myName}
        roles={WORKSPACE_ROLES}
        activeRole={role}
        onRoleChange={(nextRole) => {
          setWorkingAs(nextRole);
          router.push(nextRole === 'freelancer' ? '/dashboard/freelancer' : '/dashboard');
        }}
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
          <Link className={styles.newAssignment} href="/dashboard/freelancer/make-a-pitch">
            Make a Pitch
          </Link>
        )}

        {/* avatar that opens My profile (?panel=profile) */}
        <ProfileButton name={myName} />
      </div>
    </header>
  );
}
