import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import type { Pitch } from '../../../types/dashboard.types';
import { listPitchesForFreelancer, loadPitchViewer } from '../../../../lib/pitches';
import { requireWorkspace } from '../../../../lib/workspace';
import MyPitchesList from './components/MyPitchesList';
import styles from './myPitches.module.css';

// A review changes the statuses shown here, so the list is never served from a cache
export const dynamic = 'force-dynamic';

export default async function MyPitchesPage() {
  await requireWorkspace('freelancer');

  // The pitches this freelancer sent; a failed load shows the empty state rather than crashing
  let pitches: Pitch[] = [];
  try {
    const { userId } = await auth();
    const viewer = userId ? await loadPitchViewer(userId) : null;
    pitches = viewer ? await listPitchesForFreelancer(viewer.userId) : [];
  } catch (error) {
    console.error('Failed to load your pitches.', error);
  }

  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Freelancer workspace</p>
            <h1 className={styles.title}>My pitches</h1>
            <p className={styles.lede}>Track your submitted story ideas and read the editor&apos;s feedback.</p>
          </div>
        </header>

        {pitches.length ? (
          <MyPitchesList pitches={pitches} />
        ) : (
          <p className={styles.panel}>
            You haven&apos;t submitted a pitch yet. <Link href="/dashboard/freelancer/make-a-pitch">Make a pitch</Link>.
          </p>
        )}
      </main>
    </div>
  );
}
