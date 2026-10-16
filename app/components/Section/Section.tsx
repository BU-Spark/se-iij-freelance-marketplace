import styles from './Section.module.css';
import type { ReactNode } from 'react';

type SectionProps = {
  title: string;
  hint?: string;
  color: string;
  error?: string;
  children: ReactNode;
};

export default function Section({ title, hint, color, error, children }: SectionProps) {
  return (
    <section className={styles.section} style={{ ['--accent' as string]: color }}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
