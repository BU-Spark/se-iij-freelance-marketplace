import { EditorHeader } from '../../components/header/EditorHeader';
import { requireWorkspace } from '../../../lib/workspace';
import PitchInbox from './PitchInbox';
import { PITCHES } from './constants';
import styles from './pitches.module.css';

export default async function PitchesPage() {
  // The pitch inbox belongs to the editor desk
  await requireWorkspace('editor');

  return (
    <div className={styles.shell}>
      <EditorHeader />
      <PitchInbox pitches={PITCHES} />
    </div>
  );
}
