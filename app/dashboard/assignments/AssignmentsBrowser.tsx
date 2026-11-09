'use client';

import { useState } from 'react';
import Link from 'next/link';
import OpenAssignmentCard from '../../components/AssignmentCard/OpenAssignmentCard';
import type { Assignment } from '../../types/assignments.types';
import styles from './assignments.module.css';

type AssignmentsBrowserProps = {
  /** Open assignments loaded from the database */
  assignments: Assignment[];
  /** true when the database could not be reached */
  loadFailed?: boolean;
};

export default function AssignmentsBrowser({ assignments, loadFailed = false }: AssignmentsBrowserProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const categories = [...new Set(assignments.map((a) => a.category).filter(Boolean))].sort();
  const locations = [...new Set(assignments.map((a) => a.location).filter(Boolean))].sort();
  const visibleAssignments = assignments.filter(
    (assignment) =>
      [assignment.title, assignment.category, assignment.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      ) &&
      (!category || assignment.category === category) &&
      (!location || assignment.location === location)
  );

  const clearFilters = () => {
    setQuery('');
    setCategory('');
    setLocation('');
  };

  return (
    <main className={styles.main}>
      <Link href="/dashboard/freelancer" className={styles.backLink}>
        ← Back to freelancer dashboard
      </Link>
      <div className={styles.heading}>
        <p className={styles.eyebrow}>Find your next assignment</p>
        <h1>Assignments</h1>
        <p className={styles.description}>Browse open assignments by keyword, category, and location.</p>
      </div>
      {loadFailed ? (
        <p className={styles.results} role="alert">
          We couldn&apos;t load assignments right now. Please try again in a moment.
        </p>
      ) : assignments.length === 0 ? (
        <p className={styles.results} role="status">
          No open assignments yet. Check back soon.
        </p>
      ) : (
        <>
          <section className={styles.filters} aria-label="Filter assignments">
            <label className={styles.filterField}>
              Keywords
              <input
                type="search"
                placeholder="Search title, category, or description"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className={styles.filterField}>
              Category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.filterField}>
              Location
              <select value={location} onChange={(event) => setLocation(event.target.value)}>
                <option value="">All locations</option>
                {locations.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearFilters}
              disabled={!query && !category && !location}
            >
              Clear filters
            </button>
          </section>
          <p className={styles.results} role="status">
            Showing {visibleAssignments.length} of {assignments.length} open assignments
            {visibleAssignments.length === 0 && '. No matches. Try changing or clearing your filters.'}
          </p>
          <ul className={styles.grid}>
            {visibleAssignments.map((assignment) => (
              <li key={assignment.id}>
                <OpenAssignmentCard assignment={assignment} href={`/dashboard/assignments/${assignment.id}`} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
