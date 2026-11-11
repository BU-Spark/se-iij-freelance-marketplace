'use client';

import { useState } from 'react';
import { RosterCard, useToast } from '../../components';
import Modal from '../../components/Modal/Modal';
import InvitePicker from './InvitePicker';
import type { AvailabilityStatus, RosterMember } from '../../types/dashboard.types';
import { US_STATE_NAMES, matchesLocation, usStateOf } from '../../utils/location.utils';
import styles from './roster.module.css';

type RosterBrowserProps = {
  /** freelancers this editor has invited onto their roster */
  members: RosterMember[];
  /** everyone else, who can still be invited */
  invitable: RosterMember[];
  /** the load failed, which is different from an empty roster */
  loadFailed?: boolean;
};

type SortKey = 'name' | 'recent' | 'availability';

const STATUS_FILTERS: { value: '' | AvailabilityStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'off', label: 'Off today' },
];

const STATUS_RANK: Record<AvailabilityStatus, number> = { available: 0, busy: 1, off: 2 };

const beatsOf = (member: RosterMember) => member.beats ?? [member.specialty];

/** Unique, sorted values for a dropdown */
const options = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));

const formatAdded = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Search text matches the name, any beat, or the city */
function matchesQuery(member: RosterMember, query: string) {
  if (!query) return true;
  return [member.name, member.city, ...beatsOf(member)].some((value) => value.toLowerCase().includes(query));
}

function compare(sort: SortKey) {
  return (a: RosterMember, b: RosterMember) => {
    if (sort === 'recent') return (b.invitedAt ?? '').localeCompare(a.invitedAt ?? '');
    if (sort === 'availability' && a.status !== b.status) return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    return a.name.localeCompare(b.name);
  };
}

/*
 * Invites and removals are saved through the roster API; the list only changes once the server confirms
 * them, so a failed request shows an error instead of a roster that is not really there.
 */
export default function RosterBrowser({ members, invitable, loadFailed = false }: RosterBrowserProps) {
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [beat, setBeat] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'' | AvailabilityStatus>('');
  const [sort, setSort] = useState<SortKey>('name');

  const [inviting, setInviting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [roster, setRoster] = useState(members);
  const [others, setOthers] = useState(invitable);
  /** true while an invite or a removal is in flight */
  const [saving, setSaving] = useState(false);

  const beats = options(roster.flatMap(beatsOf));
  // places outside the US still get their own option, after the states
  const otherPlaces = options(roster.map((member) => member.city).filter((place) => !usStateOf(place)));

  const normalizedQuery = query.trim().toLowerCase();
  const withoutStatus = roster.filter(
    (member) =>
      matchesQuery(member, normalizedQuery) &&
      (!beat || beatsOf(member).includes(beat)) &&
      matchesLocation(member.city, city)
  );
  // the status chips count what the other filters leave, so the numbers always add up
  const statusCount = (value: '' | AvailabilityStatus) =>
    value ? withoutStatus.filter((member) => member.status === value).length : withoutStatus.length;
  const visible = withoutStatus.filter((member) => !status || member.status === status).sort(compare(sort));

  const activeFilters = [query.trim(), beat, city, status].filter(Boolean).length;

  const clearFilters = () => {
    setQuery('');
    setBeat('');
    setCity('');
    setStatus('');
  };

  const openInvite = () => {
    setPicked([]);
    setInviting(true);
  };

  const togglePick = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]));

  const sendInvites = async () => {
    const chosen = others.filter((member) => picked.includes(member.id));
    if (chosen.length === 0) return;

    setSaving(true);
    try {
      const response = await fetch('/api/roster/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freelancerIds: chosen.map((member) => member.id) }),
      });

      const body = (await response.json().catch(() => null)) as {
        invited?: { freelancerId: string; invitedAt: string }[];
        error?: string;
      } | null;

      if (!response.ok) {
        showToast(body?.error ?? 'Could not add them to your roster right now.', 'error');
        return;
      }

      const invitedAt = new Map((body?.invited ?? []).map((row) => [row.freelancerId, row.invitedAt]));
      const added = chosen.map((member) => ({
        ...member,
        invitedAt: invitedAt.get(member.id) ?? new Date().toISOString(),
      }));

      setRoster((list) => [...list, ...added]);
      setOthers((list) => list.filter((member) => !picked.includes(member.id)));
      showToast(added.length === 1 ? `Added ${added[0].name} to your roster` : `Added ${added.length} freelancers`);
      setInviting(false);
    } catch (error) {
      console.error('Could not add freelancers to the roster.', error);
      showToast('Could not add them to your roster right now.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: RosterMember) => {
    setConfirmingId(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/roster/invites/${member.id}`, { method: 'DELETE' });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        showToast(body?.error ?? 'Could not remove them from your roster right now.', 'error');
        return;
      }

      setRoster((list) => list.filter((m) => m.id !== member.id));
      // they go back to the invite list, so the editor can change their mind
      setOthers((list) => [...list, { ...member, invitedAt: undefined }].sort((a, b) => a.name.localeCompare(b.name)));
      showToast(`Removed ${member.name} from your roster`);
    } catch (error) {
      console.error('Could not remove the freelancer from the roster.', error);
      showToast('Could not remove them from your roster right now.', 'error');
    } finally {
      setSaving(false);
    }
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

  const inviteButton = (
    <button type="button" className={styles.inviteButton} onClick={openInvite} disabled={others.length === 0}>
      <span aria-hidden="true">+</span> Invite freelancers
    </button>
  );

  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Your freelancers</p>
          <h1 className={styles.title}>
            Roster
            {roster.length > 0 && (
              <span className={styles.countBadge} aria-label={`${roster.length} on your roster`}>
                {roster.length}
              </span>
            )}
          </h1>
          <p className={styles.description}>Freelancers you&apos;ve invited to work with you.</p>
        </div>
        <div className={styles.headingSide}>{inviteButton}</div>
      </div>

      {roster.length === 0 ? (
        <div className={styles.empty} role="status">
          <h2>No one on your roster yet</h2>
          <p>
            {others.length > 0
              ? 'Invite freelancers you work with, and they will show up here with their beats and availability.'
              : 'No freelancers have finished setting up their profile yet. Check back once some have joined.'}
          </p>
          {others.length > 0 && inviteButton}
        </div>
      ) : (
        <>
          <section className={styles.panel} aria-label="Filter your roster">
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
              <FilterSelect label="Beat" value={beat} onChange={setBeat} all="All beats" values={beats} />
              <label className={styles.filterField}>
                Location
                <select
                  value={city}
                  data-default={!city || undefined}
                  onChange={(event) => setCity(event.target.value)}
                >
                  <option value="">All locations</option>
                  <optgroup label="US states">
                    {US_STATE_NAMES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </optgroup>
                  {otherPlaces.length > 0 && (
                    <optgroup label="Other places">
                      {otherPlaces.map((place) => (
                        <option key={place} value={place}>
                          {place}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              <label className={styles.filterField}>
                Sort by
                <select
                  value={sort}
                  data-default={sort === 'name' || undefined}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                >
                  <option value="name">Name</option>
                  <option value="recent">Recently added</option>
                  <option value="availability">Available first</option>
                </select>
              </label>
            </div>

            <div className={styles.toolbar}>
              <div className={styles.chips} role="group" aria-label="Availability">
                {STATUS_FILTERS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={status === option.value}
                    className={`${styles.chip} ${status === option.value ? styles.chipOn : ''}`}
                    onClick={() => setStatus(option.value)}
                  >
                    {option.value && <span className={`${styles.dot} ${styles[option.value]}`} aria-hidden="true" />}
                    {option.label}
                    <span className={styles.chipCount}>{statusCount(option.value)}</span>
                  </button>
                ))}
              </div>
              <div className={styles.toolbarEnd}>
                <p className={styles.results} role="status">
                  Showing {visible.length} of {roster.length} freelancers
                </p>
                {activeFilters > 0 && (
                  <button type="button" className={styles.clearButton} onClick={clearFilters}>
                    Clear filters ({activeFilters})
                  </button>
                )}
              </div>
            </div>
          </section>

          {visible.length === 0 && (
            <p className={styles.noMatches}>No matches. Try changing or clearing your filters.</p>
          )}

          <ul className={styles.grid}>
            {visible.map((member) => (
              <li key={member.id}>
                <RosterCard
                  member={member}
                  footer={
                    <>
                      <span className={styles.added}>
                        {member.invitedAt ? `Added ${formatAdded(member.invitedAt)}` : 'On your roster'}
                      </span>
                      {confirmingId === member.id ? (
                        <span className={styles.confirm}>
                          Remove?
                          <button
                            type="button"
                            className={styles.dangerLink}
                            disabled={saving}
                            onClick={() => void remove(member)}
                          >
                            Yes, remove
                          </button>
                          <button type="button" className={styles.textButton} onClick={() => setConfirmingId(null)}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.textButton}
                          aria-label={`Remove ${member.name} from your roster`}
                          onClick={() => setConfirmingId(member.id)}
                        >
                          Remove
                        </button>
                      )}
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {inviting && (
        <Modal
          title="Invite to your roster"
          subtitle="Pick the freelancers you want to work with. You can remove them any time."
          onClose={() => setInviting(false)}
          footer={
            <>
              <span className={styles.pickedCount} aria-live="polite">
                {picked.length} selected
              </span>
              <div className={styles.modalActions}>
                <button type="button" className={styles.textButton} onClick={() => setInviting(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.inviteButton}
                  onClick={() => void sendInvites()}
                  disabled={picked.length === 0 || saving}
                >
                  {saving ? 'Adding…' : picked.length > 0 ? `Add ${picked.length} to roster` : 'Add to roster'}
                </button>
              </div>
            </>
          }
        >
          <InvitePicker people={others} picked={picked} onToggle={togglePick} />
        </Modal>
      )}
    </main>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** the "no filter" option's text */
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
