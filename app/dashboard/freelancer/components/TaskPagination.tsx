import styles from '../freelancer.module.css';
export type TaskPaginationProps = { page: number; pageCount: number; onPageChange: (page: number) => void };
export function TaskPagination({ page, pageCount, onPageChange }: TaskPaginationProps) {
  return (
    <nav aria-label="Task feed pagination" className={styles.pagination}>
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
