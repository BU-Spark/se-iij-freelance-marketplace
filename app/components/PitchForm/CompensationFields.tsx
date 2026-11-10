import type { PitchCompensation } from '../../types/pitchForm.types';
import styles from './PitchForm.module.css';

export type CompensationFieldsProps = {
  value: PitchCompensation;
  onChange: (value: PitchCompensation) => void;
  error?: string;
};
export function CompensationFields({ value, onChange, error }: CompensationFieldsProps) {
  return (
    <fieldset className={styles.fieldset}>
      <legend>Proposed compensation</legend>
      <div className={styles.row}>
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="any"
            value={value.amount}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'compensation-error' : undefined}
            onChange={(event) => onChange({ ...value, amount: event.target.value })}
          />
        </label>
        <label>
          Currency
          <select
            value={value.currency}
            onChange={(event) => onChange({ ...value, currency: event.target.value as PitchCompensation['currency'] })}
          >
            {['USD', 'GBP', 'EUR'].map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <label>
          Rate basis
          <select
            value={value.unit}
            onChange={(event) => onChange({ ...value, unit: event.target.value as PitchCompensation['unit'] })}
          >
            <option value="flat">Flat fee</option>
            <option value="word">Per word</option>
            <option value="hour">Per hour</option>
          </select>
        </label>
      </div>
      {error && (
        <p id="compensation-error" className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
