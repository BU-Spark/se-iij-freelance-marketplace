import { listBeats } from '../../../lib/beats';
import type { Beat } from '../../types/admin.types';
import BeatList from './BeatList';

// A beat added a moment ago has to show up on the next visit
export const dynamic = 'force-dynamic';

/** Beats live in the database; a load failure shows an empty tab rather than crashing the admin area. */
export default async function BeatsPage() {
  let beats: Beat[] = [];

  try {
    beats = await listBeats();
  } catch (error) {
    console.error('Failed to load the beats.', error);
  }

  return <BeatList beats={beats} />;
}
