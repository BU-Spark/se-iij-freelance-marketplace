'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './NewAssignmentDrawer.module.css';

type NewAssignmentDrawerProps = {
  /** Where to go when the drawer closes, e.g. "/dashboard" */
  closeHref: string;
};

export default function NewAssignmentDrawer({ closeHref }: NewAssignmentDrawerProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // move keyboard focus into the drawer when it opens
    panelRef.current?.focus();

    // Escape closes the drawer
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push(closeHref, { scroll: false });
    };
    document.addEventListener('keydown', onKey);

    // stop the page behind from scrolling while the drawer is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [router, closeHref]);

  return (
    <>
      {/* dimmed background; clicking it closes the drawer */}
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close new assignment"
        tabIndex={-1}
        onClick={() => router.push(closeHref, { scroll: false })}
      />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-assignment-title"
        tabIndex={-1}
      >
        <div className={styles.head}>
          <div>
            <h2 id="new-assignment-title" className={styles.title}>
              New Assignment
            </h2>
            <p className={styles.subtitle}>Describe the work, then pick freelancers to invite.</p>
          </div>
          <Link href={closeHref} scroll={false} className={styles.close} aria-label="Close">
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
        </div>

        <div className={styles.body}>
          {/* TODO: form fields (next PR) and invite list (PR after) */}
          <p>Form coming soon.</p>
        </div>

        <div className={styles.foot}>
          <p className={styles.footNote}>Will post as open call</p>
          <button type="button" className={styles.send} disabled>
            Send invites
          </button>
        </div>
      </div>
    </>
  );
}
