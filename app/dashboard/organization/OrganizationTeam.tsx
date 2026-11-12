'use client';

import { useState } from 'react';
import Avatar from '../../components/Avatar/Avatar';
import { SearchBox } from '../../components/search/SearchBox';
import type { OrganizationMember } from '../../../lib/organization';
import { matchesQuery } from '../../utils/dashboard.utils';
import styles from './organization.module.css';

type OrganizationTeamProps = {
  members: OrganizationMember[];
};

/**
 * The team panel: it sticks to the top of the page and scrolls on its own, so a big newsroom does
 * not stretch the page and push the assignments away. A search keeps a long list usable without
 * loading anything extra — the whole team is one query.
 */
export default function OrganizationTeam({ members }: OrganizationTeamProps) {
  const [query, setQuery] = useState('');

  const shown = members.filter((member) =>
    matchesQuery(query, member.name, member.jobTitle, member.location ?? '', ...member.desks)
  );
  const searching = query.trim().length > 0;

  return (
    <div className={styles.teamPanel}>
      <div className={styles.teamTools}>
        <SearchBox
          aria-label="Search the team"
          placeholder="Search people, desks, cities…"
          value={query}
          onChange={setQuery}
          compact
        />
        <p className={styles.teamCount} aria-live="polite">
          {searching
            ? `${shown.length} of ${members.length}`
            : `${members.length} ${members.length === 1 ? 'person' : 'people'}`}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          {searching ? `No one matches “${query.trim()}”.` : 'Nobody else is listed under this organization yet.'}
        </p>
      ) : (
        <div className={styles.teamScroll}>
          <ul className={styles.team}>
            {shown.map((member) => (
              <li key={member.id} className={styles.person}>
                <Avatar name={member.name} size={40} />
                <div>
                  <p className={styles.personName}>{member.name}</p>
                  <p className={styles.personMeta}>{[member.jobTitle, member.location].filter(Boolean).join(' · ')}</p>
                  {member.desks.length > 0 && <p className={styles.desks}>{member.desks.join(', ')}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
