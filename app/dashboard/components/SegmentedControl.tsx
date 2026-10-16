'use client';
import styles from './SegmentedControl.module.css';

export type SegmentOption<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  /** Accessible name for the group, e.g. "Filter assignments" */
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange?: (value: T) => void;
};

/** A row of toggle buttons where exactly one is pressed (day/week/month, All/Open/…, Editor/Freelancer) */
export default function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={styles.segment}
          aria-pressed={o.value === value}
          onClick={() => onChange?.(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
