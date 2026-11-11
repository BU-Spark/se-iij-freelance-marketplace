import styles from '../Profile.module.css';

type AvailableToggleProps = {
  availableNow: boolean;
  onToggle: (availableNow: boolean) => void;
};

export default function AvailableToggle({ availableNow, onToggle }: AvailableToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={availableNow}
      className={styles.availableToggle}
      onClick={() => onToggle(!availableNow)}
    >
      <span className={styles.availableText}>
        <span className={styles.availableTitle}>Free right now</span>
        <span className={styles.availableHint}>
          {availableNow ? 'Editors see you as available' : 'Turn on to show editors you can take work'}
        </span>
      </span>
      <span className={styles.availableTrack} data-on={availableNow} aria-hidden="true">
        <span className={styles.availableThumb} />
      </span>
    </button>
  );
}
