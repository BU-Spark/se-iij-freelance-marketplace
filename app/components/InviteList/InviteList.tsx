'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import Avatar from '../Avatar/Avatar';
import type { AvailabilityStatus, RosterMember } from '../../types/dashboard.types';
import styles from './InviteList.module.css';

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off',
};

type InviteListProps = {
  members: RosterMember[];
  /** ids of the people who are invited */
  selected: string[];
  /** adds or removes one person */
  onToggle: (id: string) => void;
};

/** True when the search text matches the person's name, beat or city */
function matches(member: RosterMember, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [member.name, member.specialty, member.city].some((value) => value.toLowerCase().includes(q));
}

export default function InviteList({ members, selected, onToggle }: InviteListProps) {
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0); // which row the arrow keys are on

  const picked = members.filter((m) => selected.includes(m.id));
  const results = members.filter((m) => !selected.includes(m.id) && matches(m, query));
  const activeIndex = Math.min(active, results.length - 1);

  const pick = (member: RosterMember) => {
    if (member.status === 'off') return; // people who are off can't be invited
    onToggle(member.id);
    setQuery('');
    setActive(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && open && results[activeIndex]) {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === 'Escape' && open) {
      // close only the dropdown, not the whole drawer
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <section className={styles.wrap} aria-labelledby="invite-heading">
      <div className={styles.head}>
        <h3 id="invite-heading" className={styles.heading}>
          Invite freelancers
        </h3>
        {/* aria-live: screen readers announce the new count when it changes */}
        <span className={styles.count} aria-live="polite">
          {selected.length} selected
        </span>
      </div>
      <p className={styles.tip}>Optional. Leave empty to post as an open call.</p>

      {picked.length > 0 && (
        <ul className={styles.chips} aria-label="Invited freelancers">
          {picked.map((m) => (
            <li key={m.id} className={styles.chip}>
              <Avatar name={m.name} size={28} />
              {m.name}
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${m.name}`}
                onClick={() => onToggle(m.id)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.picker}>
        <div className={`${styles.search} ${open ? styles.searchOpen : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            role="combobox"
            aria-label="Search freelancers to invite"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined}
            autoComplete="off"
            className={styles.input}
            value={query}
            placeholder="Search your roster by name, beat or city"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
          />
        </div>

        {open && (
          <div className={styles.dropdown}>
            {results.length === 0 ? (
              <p className={styles.empty}>
                {query ? `No one on your roster matches “${query}”.` : 'Everyone on your roster is invited.'}
              </p>
            ) : (
              <ul id={listId} role="listbox" aria-label="Freelancers" className={styles.results}>
                {results.map((m, i) => {
                  const off = m.status === 'off';
                  return (
                    <li
                      key={m.id}
                      id={`${listId}-${m.id}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      aria-disabled={off}
                      className={`${styles.option} ${i === activeIndex ? styles.active : ''} ${off ? styles.disabled : ''}`}
                      // mouseDown (not click) so the search box doesn't lose focus and close first
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(m);
                      }}
                      onMouseEnter={() => setActive(i)}
                    >
                      <Avatar name={m.name} size={36} />
                      <span className={styles.who}>
                        <span className={styles.name}>{m.name}</span>
                        <span className={styles.meta}>
                          {m.specialty} · {m.city}
                        </span>
                      </span>
                      <span className={`${styles.status} ${styles[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
