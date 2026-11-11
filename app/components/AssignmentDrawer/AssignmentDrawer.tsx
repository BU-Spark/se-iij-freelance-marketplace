'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Assignment } from '../../types/assignments.types';
import AssignmentDetail from '../../dashboard/assignments/[id]/AssignmentDetail';
import styles from '../NewAssignmentDrawer/NewAssignmentDrawer.module.css';

type AssignmentDrawerProps = {
  assignment: Assignment;
  /** Where to go when the drawer closes, e.g. "/dashboard" */
  closeHref: string;
  /** true for editors from the organization that posted it */
  canEdit?: boolean;
};

/** The expanded view of one assignment, slid in from the right over the page that listed it */
export default function AssignmentDrawer({ assignment, closeHref, canEdit = false }: AssignmentDrawerProps) {
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
        aria-label="Close assignment"
        tabIndex={-1}
        onClick={() => router.push(closeHref, { scroll: false })}
      />

      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={assignment.title}
        tabIndex={-1}
      >
        <div className={styles.head}>
          <h2 className={styles.title}>Assignment</h2>
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
          {/* key: a different assignment starts out of edit mode */}
          <AssignmentDetail key={assignment.id} assignment={assignment} canEdit={canEdit} />
        </div>
      </div>
    </>
  );
}
