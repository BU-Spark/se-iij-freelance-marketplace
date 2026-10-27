'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Modal.module.css';

type ModalProps = {
  title: string;
  onClose: () => void;
  /** small label above the title, e.g. the category tag */
  eyebrow?: ReactNode;
  /** grey line under the title */
  subtitle?: ReactNode;
  /** bottom bar, e.g. "Send invites" */
  footer?: ReactNode;
  children: ReactNode;
};

export default function Modal({ title, onClose, eyebrow, subtitle, footer, children }: ModalProps) {
  const titleId = useId(); // a unique id, so screen readers know which heading names the popup
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // remember what was focused (e.g. the button that opened this), to give focus back on close
    const opener = document.activeElement as HTMLElement | null;
    boxRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.overlay}>
      {/* dimmed background; clicking it closes the popup */}
      <button type="button" className={styles.backdrop} aria-label="Close" tabIndex={-1} onClick={onClose} />

      <div ref={boxRef} className={styles.box} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className={styles.head}>
          <div className={styles.headText}>
            {eyebrow}
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.close} aria-label="Close popup" onClick={onClose}>
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
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.foot}>{footer}</div>}
      </div>
    </div>
  );
}
