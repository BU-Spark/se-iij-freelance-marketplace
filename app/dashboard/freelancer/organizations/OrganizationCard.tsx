import type { ReactNode } from 'react';
import RosterCardLayout from '../../../components/RosterCard/RosterCardLayout';
import talentStyles from '../../talent/talent.module.css';
import { REACH_LABEL, type OrgProfile } from './constants';
import styles from './organizations.module.css';

/** Only what the card draws, so a newsroom that is still signing up can preview it */
export type OrgCardDetails = Pick<
  OrgProfile,
  'name' | 'tagline' | 'reach' | 'beats' | 'city' | 'openAssignments' | 'rate'
>;

type OrganizationCardProps = {
  org: OrgCardDetails;
  /** bottom row, e.g. the grid's "View organization" button */
  footer?: ReactNode;
  className?: string;
};

/** One newsroom in the Organizations grid: name, tagline, beats and the numbers a freelancer scans for */
export default function OrganizationCard({ org, footer, className }: OrganizationCardProps) {
  return (
    <RosterCardLayout
      name={org.name}
      meta={org.city}
      status={{ tone: org.reach, label: REACH_LABEL[org.reach] }}
      className={[styles.card, className].filter(Boolean).join(' ')}
      footer={footer}
    >
      <p className={talentStyles.muted}>{org.tagline}</p>

      <dl className={talentStyles.facts}>
        <div>
          <dt>Open work</dt>
          <dd>{org.openAssignments}</dd>
        </div>
        <div>
          <dt>Rate</dt>
          <dd>{org.rate}</dd>
        </div>
      </dl>

      <ul className={talentStyles.chipList} aria-label="Beats">
        {org.beats.map((beat) => (
          <li key={beat} className={talentStyles.medium}>
            {beat}
          </li>
        ))}
      </ul>
    </RosterCardLayout>
  );
}
