'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import ProfileContent from '../../components/Profile/ProfileContent';
import { useToast } from '../../components/Toast/ToastProvider';
import { useProfile } from '../../hooks/useProfile';
import type { BasicInfo, ProfileRole, RoleDetails } from '../../types/profile.types';
import styles from './settings.module.css';

const SAVE_FAILED = 'Could not save your profile. Please try again.';

/**
 * Settings is the profile page: the same cards the profile panel shows, on a page. Availability is
 * not a section of its own — it opens with the role it belongs to.
 */
export default function SettingsPage() {
  const { isLoaded } = useAuth();
  const { showToast } = useToast();
  const { profile, error, needsOnboarding, saveBasic, saveRole } = useProfile();

  // the header offers the desk or the pitch button depending on which side this person works on
  const role: ProfileRole = profile?.roles.some((details) => details.role === 'editor') ? 'editor' : 'freelancer';

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

  // nothing to show yet, and no answer from the profile API either way
  const pending = !isLoaded || (!profile && !needsOnboarding && !error);

  return (
    <FreelancerWorkspace role={role}>
      <main className={styles.main}>
        <header className={styles.heading}>
          <h1>Settings</h1>
          <p>Your profile and availability — the details editors and freelancers see about you.</p>
        </header>

        {pending ? (
          <p className={styles.status} role="status">
            Loading your profile…
          </p>
        ) : needsOnboarding ? (
          <>
            <p className={styles.notice}>
              You haven&apos;t set up your profile yet. Onboarding is where it gets created — it only takes a minute.
            </p>
            <Link href="/onboarding" className={styles.setupLink}>
              Finish setting up your profile →
            </Link>
          </>
        ) : profile ? (
          <ProfileContent profile={profile} onSaveBasic={handleSaveBasic} onSaveRole={handleSaveRole} />
        ) : (
          <p className={styles.status} role="status">
            {error ?? 'Your profile is unavailable right now.'}
          </p>
        )}
      </main>
    </FreelancerWorkspace>
  );
}
