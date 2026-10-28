import styles from '../Profile.module.css';

type EditButtonProps = {
  /** what screen readers hear, e.g. "Edit basic info" */
  label: string;
  onClick: () => void;
};

export default function EditButton({ label, onClick }: EditButtonProps) {
  return (
    <button type="button" className={styles.edit} aria-label={label} onClick={onClick}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      </svg>
      Edit
    </button>
  );
}
