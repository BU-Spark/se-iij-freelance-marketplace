import { ORGANIZATIONS } from './constants';
import OrganizationGrid from './OrganizationGrid';
import pageStyles from '../freelancer.module.css';
import styles from './organizations.module.css';

export default function OrganizationsPage() {
  return (
    <main className={pageStyles.main}>
      <div className={styles.intro}>
        <p className={pageStyles.eyebrow}>Freelancer workspace</p>
        <h1>Organizations</h1>
        <p>Newsrooms on the desk, what they cover and what they pay.</p>
      </div>

      <OrganizationGrid orgs={ORGANIZATIONS} />
    </main>
  );
}
