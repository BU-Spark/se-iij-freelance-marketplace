import Link from 'next/link';
import ProfileButton from '../Profile/ProfileButton';
import styles from './FreelancerWorkspace.module.css';

export type FreelancerSidebarProps = { id: string; onNavigate?: () => void };

export function FreelancerSidebar({ id, onNavigate }: FreelancerSidebarProps) {
  return (
    <aside id={id} className={styles.sidebar}>
      <nav aria-label="Freelancer menu" className={styles.menu}>
        <Link href="/dashboard/freelancer" onClick={onNavigate}>
          Dashboard
        </Link>
        <Link href="/dashboard/freelancer#active-assignments" onClick={onNavigate}>
          My assignments
        </Link>
        <Link href="/dashboard/freelancer/make-a-pitch" onClick={onNavigate}>
          Make a pitch
        </Link>
      </nav>
      <div className={styles.profile}>
        <ProfileButton />
        <span>
          <strong>My profile</strong>
          <small>Freelancer</small>
        </span>
      </div>
    </aside>
  );
}
