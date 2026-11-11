'use client';

import { useAuth } from '@clerk/nextjs';
import InfoCard from '../InfoCard/InfoCard';
import AvailabilityForm from './AvailabilityForm';
import { ROLE_CONFIG } from '../Profile/config/roleConfig';
import type { ProfileRole } from '../../types/profile.types';
import styles from './availability.module.css';

type AvailabilityCardProps = {
  /** whose hours these are: the freelancer pattern and the editor desk pattern are kept apart */
  role: ProfileRole;
};

/**
 * Shown while that role is being edited, so availability is only on screen as part of the
 * profile it belongs to. Editors read it to judge timing before they invite or assign work.
 */
export default function AvailabilityCard({ role }: AvailabilityCardProps) {
  const { userId, isLoaded } = useAuth();

  return (
    <InfoCard title={`${ROLE_CONFIG[role].label} availability`}>
      <p className={styles.hint}>
        Set whether you are free right now and your usual working hours. Editors use this to judge timing before they
        invite or assign you work.
      </p>
      {!isLoaded ? (
        <p className={styles.hint} role="status">
          Loading account…
        </p>
      ) : userId ? (
        <AvailabilityForm key={`${userId}-${role}`} userId={userId} role={role} />
      ) : (
        <p className={styles.hint}>Please sign in to edit your availability.</p>
      )}
    </InfoCard>
  );
}
