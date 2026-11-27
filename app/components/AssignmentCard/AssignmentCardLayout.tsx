import type { ReactNode } from 'react';
import Link from 'next/link';
import type { AssignmentStatus } from '../../types/dashboard.types';
import { formatDeadline } from '../../utils/dashboard.utils';
import { categoryColor } from '../../utils/category.utils';
import styles from './AssignmentCard.module.css';

type AssignmentCardLayoutProps = {
  title: string;
  category: string;
  /** the status pill: `tone` picks the colour, `label` is the wording each view wants */
  status: { tone: AssignmentStatus; label: string };
  urgent?: boolean;
  /** shown as "Due …" in the top row */
  deadline?: Date | null;
  /** control at the end of the top row, e.g. the report flag */
  action?: ReactNode;
  /** where clicking the card goes; without it the title is plain text */
  href?: string;
  organization?: string;
  contact?: string;
  details: { label: string; value: ReactNode }[];
  footer?: ReactNode;
  className?: string;
};

/** The look shared by every assignment card; each view decides what goes in it. */
export default function AssignmentCardLayout({
  title,
  category,
  status,
  urgent,
  deadline,
  action,
  href,
  organization,
  contact,
  details,
  footer,
  className,
}: AssignmentCardLayoutProps) {
  return (
    <article className={[styles.card, href && styles.clickable, className].filter(Boolean).join(' ')}>
      <div className={styles.top}>
        <span className={styles.category}>
          <span className={styles.dot} style={{ background: categoryColor(category) }} aria-hidden="true" />
          {category}
        </span>
        {urgent && <span className={`${styles.pill} ${styles.urgent}`}>Urgent</span>}
        <span className={`${styles.pill} ${styles[status.tone]}`}>{status.label}</span>
        {deadline && <span className={styles.deadline}>Due {formatDeadline(deadline)}</span>}
        {action}
      </div>

      <div>
        <h3 className={styles.title}>
          {href ? (
            <Link href={href} className={styles.cardLink} scroll={false}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {organization && <p className={styles.organization}>{organization}</p>}
        {contact && <p className={styles.contact}>{contact}</p>}
      </div>

      <dl className={styles.details}>
        {details.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {footer}
    </article>
  );
}
