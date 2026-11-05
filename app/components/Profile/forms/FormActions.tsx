import styles from '../Profile.module.css';

type FormActionsProps = {
  onCancel: () => void;
  /** disables Save while the change is in flight */
  saving?: boolean;
};

export default function FormActions({ onCancel, saving = false }: FormActionsProps) {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.cancel} onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      {/* type="submit" so pressing Enter in a field also saves */}
      <button type="submit" className={styles.save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
