'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import type { ProfileRole } from '../../types';
import HamburgerMenu from '../NavMenu/HamburgerMenu';
import ProfileButton from '../Profile/ProfileButton';
import { useProfile } from '../../hooks/useProfile';
import { fullName } from '../../utils/profile.utils';
import { workspaceForPath, workspaceHome } from '../../utils/workspace.utils';
import styles from './editorHeader.module.css';

type EditorHeaderProps = {
  /** The roles the server already read for this person, used until the profile loads */
  initialRoles?: ProfileRole[];
};

/** The one header for every dashboard page; the dashboard layout mounts it above each page */
export function EditorHeader({ initialRoles = [] }: EditorHeaderProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { profile } = useProfile();

  const myName = profile ? fullName(profile) : '';

  /*
   * The profile decides which workspaces this person has. Until it loads we lean on the roles the
   * server read, and failing that only offer the one being viewed, so the switch never flashes a
   * role they do not hold.
   */
  const loadedRoles = profile?.roles.map((details) => details.role) ?? [];
  const heldRoles = loadedRoles.length > 0 ? loadedRoles : initialRoles;
  const viewingAs = workspaceForPath(pathname, heldRoles);
  const roles: ProfileRole[] = heldRoles.length > 0 ? heldRoles : [viewingAs];
  // The header stays mounted across pages, so the side always follows the URL (back button included)
  const role = roles.includes(viewingAs) ? viewingAs : roles[0];

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
        onRoleChange={(nextRole) => router.push(nextRole === 'freelancer' ? '/dashboard/freelancer' : '/dashboard')}
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
