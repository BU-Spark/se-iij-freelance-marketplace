import type { CSSProperties } from 'react';
import styles from '../Profile.module.css';

type ProfileRowProps = {
  label: string;
  /** what screen readers hear, e.g. "Open Basic info" */
  ariaLabel: string;
  icon: string;
  /** colours for the icon circle, its glyph and the hover border */
  accent: string;
  tint: string;
  ink: string;
  onOpen: () => void;
};

/** A tappable row on My profile that opens a section (basic info or a role) in its own drawer */
export default function ProfileRow({ label, ariaLabel, icon, accent, tint, ink, onOpen }: ProfileRowProps) {
  const colours = { '--row-accent': accent, '--row-tint': tint } as CSSProperties;

  return (
    <button type="button" className={styles.profileRow} style={colours} aria-label={ariaLabel} onClick={onOpen}>
      <span className={styles.rowIcon} style={{ color: ink }} aria-hidden="true">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon} />
        </svg>
      </span>
      <span className={styles.rowName}>{label}</span>
      <svg
        className={styles.rowChevron}
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}
