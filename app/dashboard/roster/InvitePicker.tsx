'use client';

import { useState } from 'react';
import Avatar from '../../components/Avatar/Avatar';
import type { AvailabilityStatus, RosterMember } from '../../types/dashboard.types';
import styles from './InvitePicker.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = { available: 'Available', busy: 'Busy', off: 'Off today' };

type InvitePickerProps = {
  /** freelancers not on the roster yet */
  people: RosterMember[];
  /** ids ticked so far */
  picked: string[];
  onToggle: (id: string) => void;
};

/** A search box over an always-visible list of freelancers, each with a tick box */
export default function InvitePicker({ people, picked, onToggle }: InvitePickerProps) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const results = people.filter((person) =>
    [person.name, person.city, ...(person.beats ?? [person.specialty])].some((v) => v.toLowerCase().includes(q))
  );

  return (
    <div className={styles.picker}>
      <label className={styles.search}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={styles.srOnly}>Search freelancers</span>
        <input
          type="search"
          placeholder="Search by name, beat or city"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {results.length === 0 ? (
        <p className={styles.empty}>No freelancer matches “{query.trim()}”.</p>
      ) : (
        <ul className={styles.list} aria-label="Freelancers you can save">
          {results.map((person) => {
            const on = picked.includes(person.id);
            return (
              <li key={person.id}>
                <label className={`${styles.row} ${on ? styles.rowOn : ''}`}>
                  <input type="checkbox" className={styles.srOnly} checked={on} onChange={() => onToggle(person.id)} />
                  <Avatar name={person.name} size={40} />
                  <span className={styles.who}>
                    <span className={styles.name}>{person.name}</span>
                    <span className={styles.meta}>{[person.specialty, person.city].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className={`${styles.status} ${styles[person.status]}`}>{STATUS_LABEL[person.status]}</span>
                  <span className={styles.tick} aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
