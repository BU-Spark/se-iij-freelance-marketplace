'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './SidePanel.module.css';

type SidePanelProps = {
  title: string;
  /** which edge it slides in from */
  side?: 'left' | 'right';
  onClose: () => void;
  /** optional bottom bar, e.g. a Sign out button */
  footer?: ReactNode;
  /** 'navy' gives the dark header the page drawers use (new assignment, assignment detail) */
  tone?: 'light' | 'navy';
  /** optional content under the title, inside the header, e.g. the person's photo and name */
  header?: ReactNode;
  children: ReactNode;
};

export default function SidePanel({
  title,
  side = 'right',
  onClose,
  footer,
  tone = 'light',
  header,
  children,
}: SidePanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // remember what opened the panel, so focus can go back there on close
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    // panels can stack (a role opened from My profile), so Escape only closes the top one
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const open = document.querySelectorAll('[data-side-panel]');
      if (open[open.length - 1] === panelRef.current) onClose();
    };
    document.addEventListener('keydown', onKey);

    // put back whatever was there, so closing a stacked panel keeps the page under the other one locked
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      {/* dimmed background; clicking it closes the panel */}
      <button type="button" className={styles.backdrop} aria-label="Close" tabIndex={-1} onClick={onClose} />

      <div
        ref={panelRef}
        className={`${styles.panel} ${styles[side]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-side-panel
      >
        <div className={`${styles.head} ${tone === 'navy' ? styles.navy : ''}`}>
          <div className={styles.headRow}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} aria-label={`Close ${title}`} onClick={onClose}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {header}
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.foot}>{footer}</div>}
      </div>
    </div>
  );
}
