import styles from '../Profile.module.css';

type FormActionsProps = {
  onCancel: () => void;
};

export default function FormActions({ onCancel }: FormActionsProps) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.cancel} onClick={onCancel}>
        Cancel
      </button>
      {/* type="submit" so pressing Enter in a field also saves */}
      <button type="submit" className={styles.save}>
        Save
      </button>
    </div>
  );
}
