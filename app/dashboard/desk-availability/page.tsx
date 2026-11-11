'use client';

import { useAuth } from '@clerk/nextjs';
import { FreelancerWorkspace } from '../../components/FreelancerWorkspace';
import AvailabilityForm from '../../components/Availability/AvailabilityForm';
import styles from '../../components/Availability/availability.module.css';

/** The editor's version of the availability page: their hours at the desk, not working hours */
export default function DeskAvailabilityPage() {
  const { userId, isLoaded } = useAuth();

  return (
    <FreelancerWorkspace role="editor">
      <main className={styles.main}>
        <h1>My availability</h1>
        <p>Set whether you are free right now and your usual hours at the desk.</p>
        <p>Freelancers use this to time their pitches and deadlines.</p>
        {!isLoaded ? (
          <p role="status">Loading account…</p>
        ) : userId ? (
          <AvailabilityForm key={userId} userId={userId} />
        ) : (
          <p>Please sign in to edit your availability.</p>
        )}
      </main>
    </FreelancerWorkspace>
  );
}
