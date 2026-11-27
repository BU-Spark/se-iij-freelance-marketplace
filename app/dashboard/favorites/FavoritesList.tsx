'use client';

import { useState } from 'react';
import Link from 'next/link';
import Avatar from '../../components/Avatar/Avatar';
import FavoriteButton from '../../components/FavoriteButton/FavoriteButton';
import PreInvite from '../../components/PreInvite/PreInvite';
import { useFavorites } from '../../hooks/useFavorites';
import { useRoster } from '../../hooks/useRoster';
import type { AvailabilityStatus, RosterMember } from '../../types/dashboard.types';
import { PRE_INVITE_LABEL, type PreInviteState, preInviteState } from '../../utils/favorites.utils';
import rosterStyles from '../roster/roster.module.css';
import favoriteStyles from './favorites.module.css';

const styles = { ...rosterStyles, ...favoriteStyles };

type FavoritesListProps = {
  editorId: string;
  /** every freelancer, whether or not they are on the roster */
  people: RosterMember[];
  /** the load failed, which is different from having no favorites */
  loadFailed?: boolean;
};

const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  off: 'Off today',
};

const FILTERS: { value: '' | PreInviteState; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'invited', label: PRE_INVITE_LABEL.invited },
  { value: 'accepted', label: PRE_INVITE_LABEL.accepted },
  { value: 'declined', label: PRE_INVITE_LABEL.declined },
];

/** Every favorite in one list, with where each pre-invitation stands */
export default function FavoritesList({ editorId, people, loadFailed = false }: FavoritesListProps) {
  const { people: everyone, busyId, preInvite } = useRoster(people);
  const { ids, ready, toggle } = useFavorites(editorId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'' | PreInviteState>('');

  if (loadFailed) {
    return (
      <main className={styles.main}>
        <p className={styles.notice} role="alert">
          Your favorites couldn&apos;t be loaded right now. Please try again in a moment.
        </p>
      </main>
    );
  }

  // favorites are read from the browser, so there is nothing truthful to draw before that
  if (!ready) return <main className={styles.main} aria-busy="true" />;

  const favorites = everyone.filter((member) => ids.includes(member.id));
  const q = query.trim().toLowerCase();
  const searched = favorites.filter((member) =>
    [member.name, member.city, ...(member.beats ?? [member.specialty])].some((value) => value.toLowerCase().includes(q))
  );
  const count = (value: '' | PreInviteState) =>
    value ? searched.filter((member) => preInviteState(member) === value).length : searched.length;
  const visible = searched
    .filter((member) => !filter || preInviteState(member) === filter)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Your freelancers</p>
          <h1 className={styles.title}>
            Favorites
            {favorites.length > 0 && (
              <span className={styles.countBadge} aria-label={`${favorites.length} favorites`}>
                {favorites.length}
              </span>
            )}
          </h1>
          <p className={styles.description}>
            Freelancers you&apos;ve hearted, saved in this browser. Pre-inviting one also adds them to your roster.
          </p>
        </div>
        <div className={styles.headingSide}>
          <Link className={styles.findLink} href="/dashboard/talent">
            Find talent
          </Link>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className={styles.empty} role="status">
          <h2>No favorites yet</h2>
          <p>Tap the heart on a freelancer in Find talent or your roster and they will show up here.</p>
        </div>
      ) : (
        <>
          <section className={styles.panel} aria-label="Filter your favorites">
            <div className={styles.filters}>
              <label className={`${styles.filterField} ${styles.searchField}`}>
                Search
                <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  placeholder="Name, beat or city"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.chips} role="group" aria-label="Pre-invitation">
                {FILTERS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={filter === option.value}
                    className={`${styles.chip} ${filter === option.value ? styles.chipOn : ''}`}
                    onClick={() => setFilter(option.value)}
                  >
                    {option.label}
                    <span className={styles.chipCount}>{count(option.value)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.toolbarEnd}>
                <p className={styles.results} role="status">
                  Showing {visible.length} of {favorites.length}
                </p>
              </div>
            </div>
          </section>

          {visible.length === 0 ? (
            <p className={styles.noMatches}>No matches. Try changing your search or filter.</p>
          ) : (
            <ul className={styles.list} aria-label="Favorite freelancers">
              {visible.map((member) => (
                <li key={member.id} className={styles.row}>
                  <Avatar name={member.name} size={40} />
                  <div className={styles.who}>
                    <h3 className={styles.name}>{member.name}</h3>
                    <p className={styles.meta}>
                      {[member.specialty, member.city, AVAILABILITY_LABEL[member.status]].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <PreInvite member={member} busy={busyId === member.id} onPreInvite={preInvite} />
                    <FavoriteButton name={member.name} favorite onToggle={() => toggle(member)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
