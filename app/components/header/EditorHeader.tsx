'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { ProfileRole } from '../../types';
import HamburgerMenu from '../NavMenu/HamburgerMenu';
import ProfileButton from '../Profile/ProfileButton';
import { useProfile } from '../../hooks/useProfile';
import { fullName } from '../../utils/profile.utils';
import { workspaceHome } from '../../utils/workspace.utils';
import styles from './editorHeader.module.css';

export function EditorHeader({ initialRole }: { initialRole?: ProfileRole } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useProfile();

  const myName = profile ? fullName(profile) : '';

  // people can switch which side of the desk they are working as; editors land on the desk by default
  const [workingAs, setWorkingAs] = useState<ProfileRole | null>(null);

  /*
   * The profile decides which workspaces this person has. Until it loads we only offer the one
   * being viewed, so the switch never flashes a role they do not hold.
   */
  const viewingAs = initialRole ?? 'editor';
  const heldRoles = profile?.roles.map((details) => details.role) ?? [];
  const roles: ProfileRole[] = heldRoles.length > 0 ? heldRoles : [viewingAs];
  const preferred = workingAs ?? viewingAs;
  const role = roles.includes(preferred) ? preferred : roles[0];

  // A deep link into a workspace they do not hold sends them home instead
  useEffect(() => {
    if (!profile) return;

    const held = profile.roles.map((details) => details.role);
    if (!held.includes(viewingAs)) router.replace(workspaceHome(held));
  }, [profile, viewingAs, router]);

  return (
    <header className={styles.headerBox}>
      {/* ☰ opens the navigation menu on the left */}
      <HamburgerMenu
        name={myName}
        roles={roles}
        activeRole={role}
        onRoleChange={(nextRole) => {
          setWorkingAs(nextRole);
          router.push(nextRole === 'freelancer' ? '/dashboard/freelancer' : '/dashboard');
        }}
        currentPath={pathname}
        settingsHref="/dashboard/settings"
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
