import { REACH_LABEL, type OrgProfile } from './constants';
import styles from './organizations.module.css';

/** Only what the card draws, so a newsroom that is still signing up can preview it */
export type OrgCardDetails = Pick<
  OrgProfile,
  'name' | 'tagline' | 'reach' | 'beats' | 'city' | 'openAssignments' | 'rate'
>;

/** One newsroom in the Organizations grid: name, tagline, beats and the numbers a freelancer scans for */
export default function OrganizationCard({ org }: { org: OrgCardDetails }) {
  return (
    <>
      <div className={styles.nameRow}>
        <h2 className={styles.name}>{org.name}</h2>
        <span className={`${styles.reach} ${styles[org.reach]}`}>{REACH_LABEL[org.reach]}</span>
      </div>
      <p className={styles.tagline}>{org.tagline}</p>

      <ul className={styles.beats} aria-label="Beats">
        {org.beats.map((beat) => (
          <li key={beat} className={styles.beat}>
            {beat}
          </li>
        ))}
      </ul>

      <dl className={styles.stats}>
        <div>
          <dt>Location</dt>
          <dd>{org.city}</dd>
        </div>
        <div>
          <dt>Open work</dt>
          <dd>{org.openAssignments}</dd>
        </div>
        <div>
          <dt>Rate</dt>
          <dd>{org.rate}</dd>
        </div>
      </dl>
    </>
  );
}
