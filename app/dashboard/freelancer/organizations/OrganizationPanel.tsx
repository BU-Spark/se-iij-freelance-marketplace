'use client';

import SidePanel from '../../../components/SidePanel/SidePanel';
import DetailList from '../../../components/DetailList/DetailList';
import type { OrgProfile } from './constants';
import styles from './organizations.module.css';

type OrganizationPanelProps = {
  org: OrgProfile;
  onClose: () => void;
};

/** The right-hand drawer with everything a freelancer reads before pitching a newsroom */
export default function OrganizationPanel({ org, onClose }: OrganizationPanelProps) {
  return (
    <SidePanel title={org.name} side="right" tone="navy" onClose={onClose}>
      <div className={styles.panelBody}>
        <p className={styles.tagline}>{org.tagline}</p>
        <p className={styles.meta}>
          {org.city} · {org.website}
        </p>

        <ul className={styles.beats} aria-label="Beats">
          {org.beats.map((beat) => (
            <li key={beat} className={styles.beat}>
              {beat}
            </li>
          ))}
        </ul>

        <DetailList
          items={[
            { label: 'Founded', value: org.founded },
            { label: 'Staff', value: org.staffSize },
            { label: 'Rate', value: org.rate },
            { label: 'Open work', value: `${org.openAssignments} open assignments` },
          ]}
        />

        <section className={styles.panelSection}>
          <h3>About</h3>
          <p>{org.bio}</p>
        </section>

        <section className={styles.panelSection}>
          <h3>Publishing cadence</h3>
          <p>{org.cadence}</p>
        </section>

        <section className={styles.panelSection}>
          <h3>What they cover</h3>
          <ul>
            {org.coverage.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </section>

        <section className={styles.panelSection}>
          <h3>Payment terms</h3>
          <p>{org.paymentTerms}</p>
        </section>
      </div>
    </SidePanel>
  );
}
