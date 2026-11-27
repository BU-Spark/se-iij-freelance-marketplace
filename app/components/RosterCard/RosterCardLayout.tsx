import type { ReactNode } from 'react';
import Avatar from '../Avatar/Avatar';
import styles from './RosterCard.module.css';

type RosterCardLayoutProps = {
  /** who the card is about; also picks the initials tile */
  name: string;
  /** the line under the name */
  meta: string;
  /** the pill in the top corner: `tone` picks the colour, `label` is the wording */
  status?: { tone: 'available' | 'busy' | 'off' | 'local' | 'us' | 'global'; label: string };
  /** whatever sits between the top row and the footer */
  children?: ReactNode;
  /** bottom row, e.g. the roster page's "Remove" control */
  footer?: ReactNode;
  className?: string;
};

/** The look shared by every directory card (people and newsrooms); each view decides what goes in it. */
export default function RosterCardLayout({ name, meta, status, children, footer, className }: RosterCardLayoutProps) {
  return (
    <article className={[styles.card, className].filter(Boolean).join(' ')}>
      <div className={styles.top}>
        <Avatar name={name} />
        <div className={styles.who}>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.meta}>{meta}</p>
        </div>
        {status && <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>}
      </div>

      {children}

      {footer && <div className={styles.footer}>{footer}</div>}
    </article>
  );
}
