'use client';

import { useState } from 'react';
import { RosterCard } from '../../components';
import { countOnRoster } from '../../utils/dashboard.utils';
import type { RosterMember } from '../../types/dashboard.types';
import styles from './roster.module.css';

type RosterBrowserProps = {
  /** freelancers this editor has invited onto their roster */
  members: RosterMember[];
  /** the load failed, which is different from an empty roster */
  loadFailed?: boolean;
};

const formatAdded = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function RosterBrowser({ members, loadFailed = false }: RosterBrowserProps) {
  const [query, setQuery] = useState('');
  const [beat, setBeat] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');

  const beats = [...new Set(members.flatMap((member) => member.beats ?? [member.specialty]))].sort();
  const cities = [...new Set(members.map((member) => member.city).filter(Boolean))].sort();

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRoster = members.filter(
    (member) =>
      member.name.toLowerCase().includes(normalizedQuery) &&
      (!beat || (member.beats ?? [member.specialty]).includes(beat)) &&
      (!city || member.city === city) &&
      (!status || member.status === status)
  );
  const hasFilters = Boolean(query || beat || city || status);

  const clearFilters = () => {
    setQuery('');
    setBeat('');
    setCity('');
    setStatus('');
  };

  if (loadFailed) {
    return (
      <main className={styles.main}>
        <p className={styles.notice} role="alert">
          The roster couldn&apos;t be loaded right now. Please try again in a moment.
        </p>
      </main>
    );
  }

  if (members.length === 0) {
    return (
      <main className={styles.main}>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Your freelancers</p>
            <h1>Roster</h1>
            <p className={styles.description}>Freelancers you&apos;ve invited to work with you.</p>
          </div>
        </div>
        <p className={styles.notice} role="status">
          You haven&apos;t invited anyone to your roster yet.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Your freelancers</p>
          <h1>Roster</h1>
          <p className={styles.description}>Freelancers you&apos;ve invited to work with you.</p>
        </div>
        <p className={styles.count}>
          <strong>{countOnRoster(members)}</strong> available or busy <span>·</span> {members.length} total
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
          Beat
          <select value={beat} onChange={(event) => setBeat(event.target.value)}>
            <option value="">All beats</option>
            {beats.map((value) => (
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
        Showing {visibleRoster.length} of {members.length} freelancers
        {visibleRoster.length === 0 && '. No matches. Try changing or clearing your filters.'}
      </p>
      <ul className={styles.grid}>
        {visibleRoster.map((member) => (
          <li key={member.id}>
            <RosterCard
              member={member}
              footer={
                <span className={styles.added}>
                  {member.invitedAt ? `Added ${formatAdded(member.invitedAt)}` : 'On your roster'}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
