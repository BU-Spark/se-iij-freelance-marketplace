import { EditorHeader } from '../../components/header/EditorHeader';
import { listRoster } from '../../../lib/roster';
import type { RosterMember } from '../../types/dashboard.types';
import RosterBrowser from './RosterBrowser';
import styles from './roster.module.css';

// Read fresh rows on every request instead of baking a snapshot into the build
export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  let members: RosterMember[] = [];
  let loadFailed = false;

  try {
    members = await listRoster();
  } catch (error) {
    console.error('Failed to load the roster.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <EditorHeader />
      <RosterBrowser members={members} loadFailed={loadFailed} />
    </div>
  );
}
