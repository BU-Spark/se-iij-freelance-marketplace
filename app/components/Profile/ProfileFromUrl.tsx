'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfilePanel from './ProfilePanel';
import SidePanel from '../SidePanel/SidePanel';
import { useToast } from '../Toast/ToastProvider';
import { useProfile } from '../../hooks/useProfile';
import type { BasicInfo, RoleDetails } from '../../types/profile.types';
import styles from './Profile.module.css';

type ProfileFromUrlProps = {
  closeHref: string;
};

const SAVE_FAILED = 'Could not save your profile. Please try again.';

/** Shows My profile when the URL has ?panel=profile */
export default function ProfileFromUrl({ closeHref }: ProfileFromUrlProps) {
  const params = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, loading, error, needsOnboarding, refresh, saveBasic, saveRole, saveAvailableNow } = useProfile();
  const open = params.get('panel') === 'profile';

  // The store may still hold a "no profile" answer from before onboarding was finished, so
  // re-check once when the panel opens rather than trusting a stale result.
  useEffect(() => {
    if (open && needsOnboarding) void refresh();
  }, [open, needsOnboarding, refresh]);

  if (!open) return null;

  const close = () => router.push(closeHref, { scroll: false });

  if (!profile) {
    // the re-check above runs on open, so say "loading" rather than flashing the setup prompt
    if (loading) {
      return (
        <SidePanel title="My profile" side="right" onClose={close}>
          <p className={styles.status} role="status">
            Loading your profile…
          </p>
        </SidePanel>
      );
    }

    if (needsOnboarding) {
      return (
        <SidePanel title="My profile" side="right" onClose={close}>
          <p className={styles.notice}>
            You haven&apos;t set up your profile yet. Onboarding is where it gets created — it only takes a minute.
          </p>
          <Link href="/onboarding" className={styles.setupLink}>
            Finish setting up your profile →
          </Link>
        </SidePanel>
      );
    }

    return (
      <SidePanel title="My profile" side="right" onClose={close}>
        <p className={styles.status} role="status">
          {error ?? 'Your profile is unavailable right now.'}
        </p>
      </SidePanel>
    );
  }

  const toast = (ok: boolean, saved: string) => showToast(ok ? saved : SAVE_FAILED, ok ? 'success' : 'error');

  const handleSaveBasic = async (basic: BasicInfo) => {
    const ok = await saveBasic(basic);
    toast(ok, 'Basic info saved');
    return ok;
  };

  const handleSaveAvailable = async (availableNow: boolean) => {
    const ok = await saveAvailableNow(availableNow);
    toast(ok, availableNow ? "You're marked as free right now" : "You're no longer marked as free");
    return ok;
  };

  const handleSaveRole = async (details: RoleDetails) => {
    const ok = await saveRole(details);
    toast(ok, 'Role details saved');
    return ok;
  };

  return (
    <ProfilePanel
      profile={profile}
      onClose={close}
      onSaveBasic={handleSaveBasic}
      onSaveRole={handleSaveRole}
      onSaveAvailable={handleSaveAvailable}
    />
  );
}
