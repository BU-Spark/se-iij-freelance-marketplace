import Link from 'next/link';
import { PitchComposer } from '../../../components/PitchForm';
import styles from './makeAPitch.module.css';

export default function MakePitchPage() {
  return (
    <>
      <Link
        href="/dashboard/freelancer/pitches"
        className={styles.backdrop}
        aria-label="Close make a pitch"
        tabIndex={-1}
      />
      <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="make-pitch-title">
        <header className={styles.head}>
          <div>
            <h1 id="make-pitch-title" className={styles.title}>
              Make a pitch
            </h1>
          </div>
          <Link href="/dashboard/freelancer/pitches" className={styles.close} aria-label="Close">
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
            Drafts are saved in this browser until you send them. Collaborator invitations are not connected yet.
          </p>
          <PitchComposer />
        </div>
      </section>
    </>
  );
}
