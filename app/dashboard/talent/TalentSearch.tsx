'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '../../components';
import TalentCard from './TalentCard';
import type { TalentFilterOptions, TalentFilters, TalentMember } from '../../types/talent.types';
import { TALENT_PAGE_SIZE, talentQueryString } from '../../utils/talent.utils';
import rosterStyles from '../roster/roster.module.css';
import talentStyles from './talent.module.css';

const styles = { ...rosterStyles, ...talentStyles };

type TalentSearchProps = {
  filters: TalentFilters;
  options: TalentFilterOptions;
  results: TalentMember[];
  loadFailed?: boolean;
};

const TYPING_DELAY_MS = 300;

/*
 * Invites only live in this component's state for now, like the roster page.
 * TODO: save them through the roster API once it exists.
 */
export default function TalentSearch({ filters, options, results, loadFailed = false }: TalentSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(filters.q ?? '');
  const [invited, setInvited] = useState<string[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const apply = (next: TalentFilters) =>
    startTransition(() => router.replace(`${pathname}${talentQueryString(next)}`, { scroll: false }));

  const setFilter = (change: Partial<TalentFilters>) => apply({ ...filters, q: query, ...change });

  const onType = (value: string) => {
    setQuery(value);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => apply({ ...filters, q: value }), TYPING_DELAY_MS);
  };

  const activeFilters = [filters.q, filters.beat, filters.medium, filters.location, filters.availableNow].filter(
    Boolean
  ).length;

  const clearFilters = () => {
    clearTimeout(typingTimer.current);
    setQuery('');
    apply({});
  };

  const invite = (member: TalentMember) => {
    setInvited((list) => [...list, member.id]);
    showToast(`Invited ${member.name} to your roster`);
  };

  if (loadFailed) {
    return (
      <main className={styles.main}>
        <p className={styles.notice} role="alert">
          The talent directory couldn&apos;t be searched right now. Please try again in a moment.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Talent directory</p>
          <h1 className={styles.title}>Find talent</h1>
          <p className={styles.description}>Search every freelancer on the platform by name, beat, medium or place.</p>
        </div>
      </div>

      <section className={styles.panel} aria-label="Search freelancers">
        <form className={styles.filters} role="search" onSubmit={(event) => event.preventDefault()}>
          <label className={`${styles.filterField} ${styles.searchField}`}>
            Search
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              placeholder="Name, beat, community or city"
              value={query}
              onChange={(event) => onType(event.target.value)}
            />
          </label>
          <FilterSelect
            label="Beat"
            value={filters.beat ?? ''}
            onChange={(beat) => setFilter({ beat })}
            all="All beats"
            values={options.beats}
          />
          <FilterSelect
            label="Medium"
            value={filters.medium ?? ''}
            onChange={(medium) => setFilter({ medium })}
            all="All mediums"
            values={options.mediums}
          />
          <FilterSelect
            label="Location"
            value={filters.location ?? ''}
            onChange={(location) => setFilter({ location })}
            all="All locations"
            values={options.locations}
          />
        </form>

        <div className={styles.toolbar}>
          <div className={styles.chips}>
            <button
              type="button"
              aria-pressed={Boolean(filters.availableNow)}
              className={`${styles.chip} ${filters.availableNow ? styles.chipOn : ''}`}
              onClick={() => setFilter({ availableNow: !filters.availableNow })}
            >
              <span className={`${styles.dot} ${styles.available}`} aria-hidden="true" />
              Free right now
            </button>
          </div>
          <div className={styles.toolbarEnd}>
            <p className={styles.results} role="status" aria-busy={isPending}>
              {isPending ? 'Searching…' : resultsLabel(results.length)}
            </p>
            {activeFilters > 0 && (
              <button type="button" className={styles.clearButton} onClick={clearFilters}>
                Clear filters ({activeFilters})
              </button>
            )}
          </div>
        </div>
      </section>

      {results.length === 0 ? (
        <p className={styles.noMatches}>
          {activeFilters > 0
            ? 'No freelancers match that search. Try fewer filters or a different word.'
            : 'No freelancers have finished setting up their profile yet.'}
        </p>
      ) : (
        <ul className={`${styles.grid} ${styles.talentGrid} ${isPending ? styles.stale : ''}`}>
          {results.map((member) => (
            <li key={member.id}>
              <TalentCard member={member} invited={invited.includes(member.id)} onInvite={invite} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function resultsLabel(count: number) {
  if (count >= TALENT_PAGE_SIZE) return `Showing the first ${count} freelancers. Narrow your search to see others.`;
  return count === 1 ? '1 freelancer' : `${count} freelancers`;
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
        data-default={!value || undefined}
        onChange={(event) => onChange(event.target.value)}
        disabled={values.length === 0}
      >
        <option value="">{all}</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
