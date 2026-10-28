import styles from './DetailList.module.css';

export type Detail = {
  label: string;
  value: string;
  /** stretch across the whole row (good for long values like email) */
  wide?: boolean;
};

type DetailListProps = {
  items: Detail[];
  /** 1 or 2 columns; 2 by default */
  columns?: 1 | 2;
};

export default function DetailList({ items, columns = 2 }: DetailListProps) {
  return (
    <dl className={`${styles.list} ${columns === 1 ? styles.one : ''}`}>
      {items.map((item) => (
        <div key={item.label} className={item.wide ? styles.wide : undefined}>
          <dt className={styles.label}>{item.label}</dt>
          {/* show a dash instead of an empty space when nothing is filled in */}
          <dd className={styles.value}>{item.value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
