'use client';

import { useId, useState } from 'react';
import { EyeIcon } from '../icons/EyeIcon';
import styles from './PasswordField.module.css';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  hintMet?: boolean;
};

export default function PasswordField({
  label,
  value,
  onChange,
  name,
  autoComplete = 'new-password',
  error,
  hint,
  hintMet,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;
  const toggleLabel = visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`;

  return (
    <div className={styles.field} data-error={!!error}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={styles.input}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          <EyeIcon revealed={visible} />
        </button>
      </div>
      {error ? (
        <span id={errorId} className={styles.error}>
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className={styles.hint} data-met={!!hintMet}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}
