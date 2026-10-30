'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RosterCard } from '../../components';
import { EditorHeader } from '../../components/header/EditorHeader';
import { ROSTER } from '../constants';
import { countOnRoster } from '../../utils/dashboard.utils';
import styles from './roster.module.css';

const specialties = [...new Set(ROSTER.map((member) => member.specialty))].sort();
const cities = [...new Set(ROSTER.map((member) => member.city))].sort();

export default function RosterPage() {
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRoster = ROSTER.filter(
    (member) =>
      member.name.toLowerCase().includes(normalizedQuery) &&
      (!specialty || member.specialty === specialty) &&
      (!city || member.city === city) &&
      (!status || member.status === status)
  );
  const hasFilters = Boolean(query || specialty || city || status);

  const clearFilters = () => {
    setQuery('');
    setSpecialty('');
    setCity('');
    setStatus('');
  };

  return (
    <div className={styles.shell}>
      <EditorHeader />
      <main className={styles.main}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to dashboard
        </Link>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Freelancer directory</p>
            <h1>Roster</h1>
            <p className={styles.description}>Browse freelancer specialties, locations, and today’s availability.</p>
          </div>
          <p className={styles.count}>
            <strong>{countOnRoster(ROSTER)}</strong> available or busy <span>·</span> {ROSTER.length} total
          </p>
        </div>
        <section className={styles.filters} aria-label="Filter freelancers">
          <label className={styles.filterField}>
            Name
            <input
              type="search"
              placeholder="Search by name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className={styles.filterField}>
            Specialty
            <select value={specialty} onChange={(event) => setSpecialty(event.target.value)}>
              <option value="">All specialties</option>
              {specialties.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            Location
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">All locations</option>
              {cities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterField}>
            Availability
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off">Off today</option>
            </select>
          </label>
          <button type="button" className={styles.clearButton} onClick={clearFilters} disabled={!hasFilters}>
            Clear filters
          </button>
        </section>
        <p className={styles.results} role="status">
          Showing {visibleRoster.length} of {ROSTER.length} freelancers
          {visibleRoster.length === 0 && '. No matches. Try changing or clearing your filters.'}
        </p>
        <ul className={styles.grid}>
          {visibleRoster.map((member) => (
            <li key={member.id}>
              <RosterCard member={member} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
