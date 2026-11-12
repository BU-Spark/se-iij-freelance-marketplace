import type { FeedFilter } from '../freelancer.utils';
// the editor's Find talent filter panel, so both sides of the app filter the same way
import styles from '../../roster/roster.module.css';
export type TaskFiltersProps = {
  query: string;
  filter: FeedFilter;
  category: string;
  location: string;
  categories: string[];
  locations: string[];
  /** "Showing 3 of 8 assignments", or why nothing shows */
  resultsLabel: string;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onClear: () => void;
};
export function TaskFilters({
  query,
  filter,
  category,
  location,
  categories,
  locations,
  resultsLabel,
  onQueryChange,
  onCategoryChange,
  onLocationChange,
  onClear,
}: TaskFiltersProps) {
  const activeFilters = [query.trim(), filter !== 'all', category, location].filter(Boolean).length;
  return (
    <section className={styles.panel} aria-label="Filter assignments by keyword, category and location">
      <form className={styles.filters} role="search" onSubmit={(event) => event.preventDefault()}>
        <label className={`${styles.filterField} ${styles.searchField}`}>
          Search
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Title, category, place or editor"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <FilterSelect
          label="Category"
          value={category}
          onChange={onCategoryChange}
          all="All categories"
          values={categories}
        />
        <FilterSelect
          label="Location"
          value={location}
          onChange={onLocationChange}
          all="All locations"
          values={locations}
        />
      </form>
      {/* no chips on this side, so the count leads the row and Clear sits at the far end */}
      <div className={styles.toolbar}>
        <p className={styles.results} role="status">
          {resultsLabel}
        </p>
        {activeFilters > 0 && (
          <button type="button" className={styles.clearButton} onClick={onClear}>
            Clear filters ({activeFilters})
          </button>
        )}
      </div>
    </section>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  all: string;
  values: string[];
};

function FilterSelect({ label, value, onChange, all, values }: FilterSelectProps) {
  return (
    <label className={styles.filterField}>
      {label}
      <select
        value={value}
        // nothing picked yet reads like a placeholder, as on Find talent
        data-default={!value || undefined}
        onChange={(event) => onChange(event.target.value)}
        disabled={values.length === 0}
      >
        <option value="">{all}</option>
        {values.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
