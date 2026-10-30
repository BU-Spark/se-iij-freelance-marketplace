import { EditorHeader } from '../../components/header/EditorHeader';
import PitchInbox from './PitchInbox';
import { PITCHES } from './constants';
import styles from './pitches.module.css';

export default function PitchesPage() {
  return (
    <div className={styles.shell}>
      <EditorHeader />
      <PitchInbox pitches={PITCHES} />
    </div>
  );
}
