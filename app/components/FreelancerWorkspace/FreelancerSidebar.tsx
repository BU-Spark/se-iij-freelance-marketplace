import Link from 'next/link';
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
        <Link href="/dashboard/availability" onClick={onNavigate}>
          My availability
        </Link>
      </nav>
      <Link className={styles.profile} href="/dashboard/profile" onClick={onNavigate}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 22v-2a8 8 0 0 1 16 0v2" />
        </svg>
        <span>
          <strong>My profile</strong>
          <small>Freelancer</small>
        </span>
      </Link>
    </aside>
  );
}
