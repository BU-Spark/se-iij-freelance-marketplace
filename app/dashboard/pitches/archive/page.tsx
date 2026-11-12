import { auth } from '@clerk/nextjs/server';
import type { ArchivedPitch } from '../../../types/dashboard.types';
import { listArchivedPitchesForEditor, loadPitchViewer } from '../../../../lib/pitches';
import { requireWorkspace } from '../../../../lib/workspace';
import PitchArchive from './PitchArchive';
import styles from '../pitches.module.css';

// Declining a pitch moves it here, so the page is never served from a cache
export const dynamic = 'force-dynamic';

export default async function PitchArchivePage() {
  // The archive belongs to the editor desk
  await requireWorkspace('editor');

  // The pitches this editor declined; a failed load shows the empty state rather than crashing
  let pitches: ArchivedPitch[] = [];
  try {
    const { userId } = await auth();
    const viewer = userId ? await loadPitchViewer(userId) : null;
    pitches = viewer ? await listArchivedPitchesForEditor(viewer.userId) : [];
  } catch (error) {
    console.error('Failed to load the pitch archive.', error);
  }

  return (
    <div className={styles.shell}>
      <PitchArchive pitches={pitches} />
    </div>
  );
}
