'use client';

import { SearchBox } from '../../components/search/SearchBox';
import { useDeskQuery } from './deskQuery';
import styles from '../dashboard.module.css';

/** The desk search: filters the availability and assignment columns as you type */
export default function DeskSearch() {
  const { query, setQuery } = useDeskQuery();

  return (
    <div className={styles.deskSearch}>
      <SearchBox
        aria-label="Search assignments and roster"
        placeholder="Search assignments, people, beats…"
        value={query}
        onChange={setQuery}
      />
    </div>
  );
}
