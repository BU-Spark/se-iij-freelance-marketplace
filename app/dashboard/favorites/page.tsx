import { auth } from '@clerk/nextjs/server';
import { loadEditorRoster } from '../../../lib/roster';
import { requireWorkspace } from '../../../lib/workspace';
import type { RosterMember } from '../../types/dashboard.types';
import FavoritesList from './FavoritesList';
import styles from '../roster/roster.module.css';

// A new favorite has to show up on the next visit
export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  // Favorites belong to the editor desk
  await requireWorkspace('editor');

  let people: RosterMember[] = [];
  let loadFailed = false;
  let editorId = '';

  try {
    const { userId } = await auth();
    editorId = userId ?? '';

    if (userId) {
      // anyone can be a favorite, on the roster or not; the list picks out the hearted ones
      const { members, invitable } = await loadEditorRoster(userId);
      people = [...members, ...invitable];
    }
  } catch (error) {
    console.error('Failed to load favorites.', error);
    loadFailed = true;
  }

  return (
    <div className={styles.shell}>
      <FavoritesList editorId={editorId} people={people} loadFailed={loadFailed} />
    </div>
  );
}
