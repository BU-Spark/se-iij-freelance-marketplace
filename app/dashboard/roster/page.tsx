import { EditorHeader } from '../../components/header/EditorHeader';
import RosterBrowser from './RosterBrowser';
import { ROSTER_INVITABLE, ROSTER_MEMBERS } from './constants';
import styles from './roster.module.css';

export default function RosterPage() {
  return (
    <div className={styles.shell}>
      <EditorHeader />
      {/* sample data until the roster API exists */}
      <RosterBrowser members={ROSTER_MEMBERS} invitable={ROSTER_INVITABLE} />
    </div>
  );
}
