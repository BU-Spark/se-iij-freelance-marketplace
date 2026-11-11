'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import ProfileContent from '../../components/Profile/ProfileContent';
import { useToast } from '../../components/Toast/ToastProvider';
import { useProfile } from '../../hooks/useProfile';
import type { BasicInfo, RoleDetails } from '../../types/profile.types';
import styles from '../settings/settings.module.css';

const SAVE_FAILED = 'Could not save your profile. Please try again.';

/**
 * Settings → Profile: the same cards the profile panel shows, on their own page. Availability is
 * not a section of its own — it opens with the role it belongs to. Sign-in details live on their
 * own page, so this one is only about how the person appears to the other side of the desk.
 */
export default function SettingsProfilePage() {
  const { isLoaded } = useAuth();
  const { showToast } = useToast();
  const { profile, error, needsOnboarding, saveBasic, saveRole } = useProfile();

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
    <section aria-labelledby="profile-heading">
      <div className={styles.sectionHead}>
        <h2 id="profile-heading">Profile</h2>
        <p>How you appear to the other side of the desk. Keep it current so people can find you.</p>
      </div>

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
    </section>
  );
}
