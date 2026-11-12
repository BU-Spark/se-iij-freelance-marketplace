import type { PitchCompensation } from '../../types/pitchForm.types';
import styles from './PitchForm.module.css';

export type CompensationFieldsProps = {
  value: PitchCompensation;
  onChange: (value: PitchCompensation) => void;
  error?: string;
};
export function CompensationFields({ value, onChange, error }: CompensationFieldsProps) {
  return (
    <label>
      <span className={styles.label}>Proposed compensation</span>
      <span className={styles.money}>
        <span className={styles.currencySign} aria-hidden="true">
          $
        </span>
        <input
          type="number"
          min="0"
          step="any"
          aria-label="Proposed compensation"
          className={styles.moneyInput}
          value={value.amount}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'compensation-error' : undefined}
          onChange={(event) => onChange({ ...value, amount: event.target.value })}
        />
      </span>
      {error && (
        <span id="compensation-error" className={styles.error}>
          {error}
        </span>
      )}
    </label>
  );
}
