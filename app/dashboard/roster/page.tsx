import { auth } from '@clerk/nextjs/server';
import { loadEditorRoster } from '../../../lib/roster';
import { requireWorkspace } from '../../../lib/workspace';
import type { RosterMember } from '../../types/dashboard.types';
import RosterBrowser from './RosterBrowser';
import styles from './roster.module.css';

// A new save has to show up on the next visit
export const dynamic = 'force-dynamic';

export default async function RosterPage() {
  // The roster belongs to the editor desk
  await requireWorkspace('editor');

  let members: RosterMember[] = [];
  let invitable: RosterMember[] = [];
  let loadFailed = false;

  try {
    const { userId } = await auth();
    if (userId) ({ members, invitable } = await loadEditorRoster(userId));
  } catch (error) {
    console.error('Failed to load the roster.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <RosterBrowser members={members} invitable={invitable} loadFailed={loadFailed} />
    </div>
  );
}
