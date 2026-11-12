import { auth } from '@clerk/nextjs/server';
import type { Pitch } from '../../types/dashboard.types';
import { listPitchesForEditor, loadPitchViewer } from '../../../lib/pitches';
import { requireWorkspace } from '../../../lib/workspace';
import PitchInbox from './PitchInbox';
import styles from './pitches.module.css';

// A review changes what this inbox shows, so the page is never served from a cache
export const dynamic = 'force-dynamic';

export default async function PitchesPage() {
  // The pitch inbox belongs to the editor desk
  await requireWorkspace('editor');

  // The pitches this editor received; a failed load shows an empty inbox rather than crashing
  let pitches: Pitch[] = [];
  try {
    const { userId } = await auth();
    const viewer = userId ? await loadPitchViewer(userId) : null;
    pitches = viewer ? await listPitchesForEditor(viewer.userId) : [];
  } catch (error) {
    console.error('Failed to load the pitch inbox.', error);
  }

  return (
    <div className={styles.shell}>
      <PitchInbox pitches={pitches} />
    </div>
  );
}
