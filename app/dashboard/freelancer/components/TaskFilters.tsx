import type { FeedFilter } from '../freelancer.utils';
import styles from '../freelancer.module.css';
export type TaskFiltersProps = {
  query: string;
  filter: FeedFilter;
  category: string;
  location: string;
  categories: string[];
  locations: string[];
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
  onQueryChange,
  onCategoryChange,
  onLocationChange,
  onClear,
}: TaskFiltersProps) {
  return (
    <div className={styles.controls}>
      <label>
        Search tasks
        <input
          type="search"
          value={query}
          placeholder="Title, specialty, location, or editor"
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
        />
      </label>
      <label>
        Category
        <select
          value={category}
          onChange={(event) => {
            onCategoryChange(event.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        Location
        <select
          value={location}
          onChange={(event) => {
            onLocationChange(event.target.value);
          }}
        >
          <option value="">All locations</option>
          {locations.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={!query && filter === 'all' && !category && !location} onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}
