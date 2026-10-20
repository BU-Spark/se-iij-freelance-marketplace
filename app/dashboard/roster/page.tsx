import Link from 'next/link';
import { RosterCard } from '../../components';
import { Header } from '../../components/header/Header';
import { ROSTER } from '../constants';
import { countOnRoster } from '../../utils/dashboard.utils';
import styles from './roster.module.css';

export default function RosterPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to dashboard
        </Link>
        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Freelancer directory</p>
            <h1>Roster</h1>
            <p className={styles.description}>Browse freelancer specialties, locations, and today’s availability.</p>
          </div>
          <p className={styles.count}>
            <strong>{countOnRoster(ROSTER)}</strong> available or busy <span>·</span> {ROSTER.length} total
          </p>
        </div>
        <ul className={styles.grid}>
          {ROSTER.map((member) => (
            <li key={member.id}>
              <RosterCard member={member} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
