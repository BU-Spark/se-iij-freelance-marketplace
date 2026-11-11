import type { ReactNode } from 'react';
import styles from './Field.module.css';

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
  /**
   * For fields holding more than one control (a chip list). A `<label>` forwards every click to
   * its first control, so a click in the box would press the first tag's remove button instead.
   */
  group?: boolean;
};

export default function Field({ label, error, children, group }: FieldProps) {
  const content = (
    <>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </>
  );

  if (group) {
    return (
      <div className={styles.field} data-error={!!error} role="group" aria-label={label}>
        {content}
      </div>
    );
  }

  return (
    <label className={styles.field} data-error={!!error}>
      {content}
    </label>
  );
}
