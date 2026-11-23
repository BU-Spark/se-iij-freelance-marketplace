import { ORGANIZATIONS } from './constants';
import OrganizationGrid from './OrganizationGrid';
import styles from './organizations.module.css';

export default function OrganizationsPage() {
  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Freelancer workspace</p>
          <h1 className={styles.title}>Organizations</h1>
          <p className={styles.lede}>
            Newsrooms on the desk, what they cover, what they pay and whether their work is local, US only or global.
          </p>
        </header>

        <OrganizationGrid orgs={ORGANIZATIONS} />
      </main>
    </div>
  );
}
