'use client';

import { useAuth } from '@clerk/nextjs';
import AvailabilityForm from './AvailabilityForm';
import styles from './availability.module.css';

export default function AvailabilityPage() {
  const { userId, isLoaded } = useAuth();

  return (
    <main className={styles.main}>
      <h1>My availability</h1>
      <p>Set whether you are free right now and your usual working hours.</p>
      <p>Editors use this to judge timing before they invite or assign you work.</p>
      {!isLoaded ? (
        <p role="status">Loading account…</p>
      ) : userId ? (
        <AvailabilityForm key={userId} userId={userId} />
      ) : (
        <p>Please sign in to edit your availability.</p>
      )}
    </main>
  );
}
