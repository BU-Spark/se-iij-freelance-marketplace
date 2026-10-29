'use client';

import { useState } from 'react';
import AssignmentCard from '../../components/AssignmentCard/AssignmentCard';
import { Header } from '../../components/header/Header';
import { ASSIGNMENTS } from '../constants';
import styles from './assignments.module.css';

const openAssignments = ASSIGNMENTS.filter((assignment) => assignment.status === 'open');
const categories = [...new Set(openAssignments.map((assignment) => assignment.category))].sort();
const locations = [...new Set(openAssignments.map((assignment) => assignment.location))].sort();

export default function AssignmentsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleAssignments = openAssignments.filter(
    (assignment) =>
      [assignment.title, assignment.category, assignment.type].some((value) =>
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
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Find your next assignment</p>
          <h1>Assignments</h1>
          <p className={styles.description}>Browse open assignments by keyword, category, and location.</p>
        </div>
        <section className={styles.filters} aria-label="Filter assignments">
          <label className={styles.filterField}>
            Keywords
            <input
              type="search"
              placeholder="Search title, category, or type"
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
          Showing {visibleAssignments.length} of {openAssignments.length} open assignments
          {visibleAssignments.length === 0 && '. No matches. Try changing or clearing your filters.'}
        </p>
        <ul className={styles.grid}>
          {visibleAssignments.map((assignment) => (
            <li key={assignment.id}>
              <AssignmentCard assignment={assignment} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
