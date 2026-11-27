'use client';

import { useCallback, useState } from 'react';
import rosterStyles from '../../roster/roster.module.css';
import talentStyles from '../../talent/talent.module.css';
import type { OrgProfile } from './constants';
import OrganizationCard from './OrganizationCard';
import OrganizationPanel from './OrganizationPanel';
import styles from './organizations.module.css';

/** The newsroom cards; picking one opens its details in a drawer on the right */
export default function OrganizationGrid({ orgs }: { orgs: OrgProfile[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const open = orgs.find((org) => org.id === openId);

  return (
    <>
      <ul className={rosterStyles.grid}>
        {orgs.map((org) => (
          <li key={org.id}>
            <OrganizationCard
              org={org}
              className={styles.clickable}
              footer={
                // its click area stretches over the whole card
                <button
                  type="button"
                  className={`${talentStyles.toggle} ${styles.viewButton}`}
                  onClick={() => setOpenId(org.id)}
                  aria-label={`View ${org.name}`}
                >
                  View organization →
                </button>
              }
            />
          </li>
        ))}
      </ul>

      {open && <OrganizationPanel org={open} onClose={close} />}
    </>
  );
}
