import type { ReactNode } from 'react';
import styles from './InfoCard.module.css';

type InfoCardProps = {
  /** text or a small element (e.g. a coloured role pill) */
  title: ReactNode;
  /** optional button on the right of the title row, e.g. Edit */
  action?: ReactNode;
  /** optional colour for a strip along the top edge */
  accent?: string;
  children: ReactNode;
};

export default function InfoCard({ title, action, accent, children }: InfoCardProps) {
  return (
    <section className={styles.card} style={accent ? { borderTop: `4px solid ${accent}` } : undefined}>
      <div className={styles.head}>
        <div className={styles.title}>{title}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
