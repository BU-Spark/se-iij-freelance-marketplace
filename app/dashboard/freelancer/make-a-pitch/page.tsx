import Link from 'next/link';
import { PitchComposer } from '../../../components/PitchForm';
import FreelancerPage from '../page';
import styles from './makeAPitch.module.css';

// The freelancer desk shows behind the drawer, and it reads fresh data on every visit
export const dynamic = 'force-dynamic';

const CLOSE_HREF = '/dashboard/freelancer';

export default function MakePitchPage() {
  return (
    <>
      {/* keep the desk visible behind the drawer instead of an empty page */}
      <FreelancerPage />
      <Link href={CLOSE_HREF} className={styles.backdrop} aria-label="Close make a pitch" tabIndex={-1} />
      <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="make-pitch-title">
        <header className={styles.head}>
          <div>
            <h1 id="make-pitch-title" className={styles.title}>
              Make a pitch
            </h1>
            <p className={styles.subtitle}>Share your story idea with an editor</p>
          </div>
          <Link href={CLOSE_HREF} className={styles.close} aria-label="Close">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        </header>
        <div className={styles.body}>
          <p className={styles.note}>
            Drafts are saved only in this browser. Sending pitches and collaborator invitations is not connected yet.
          </p>
          <PitchComposer />
        </div>
      </section>
    </>
  );
}
