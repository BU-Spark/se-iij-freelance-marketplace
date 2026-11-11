'use client';

import { useAuth } from '@clerk/nextjs';
import InfoCard from '../InfoCard/InfoCard';
import AvailabilityForm from './AvailabilityForm';
import styles from './availability.module.css';

/**
 * Availability lives beside the profile in the settings page: editors read it to judge timing
 * before they invite or assign work, and freelancers use it to time their pitches.
 */
export default function AvailabilitySection() {
  const { userId, isLoaded } = useAuth();

  return (
    <InfoCard title="My availability">
      <p className={styles.hint}>
        Set whether you are free right now and your usual working hours. Editors use this to judge timing before they
        invite or assign you work.
      </p>
      {!isLoaded ? (
        <p className={styles.hint} role="status">
          Loading account…
        </p>
      ) : userId ? (
        <AvailabilityForm key={userId} userId={userId} />
      ) : (
        <p className={styles.hint}>Please sign in to edit your availability.</p>
      )}
    </InfoCard>
  );
}
