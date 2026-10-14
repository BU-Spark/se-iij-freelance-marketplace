import type { ReactNode } from 'react';
import styles from './Field.module.css';

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export default function Field({ label, error, children }: FieldProps) {
  return (
    <label className={styles.field} data-error={!!error}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
