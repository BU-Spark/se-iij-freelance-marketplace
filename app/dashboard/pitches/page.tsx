import { Header } from '../../components/header/Header';
import PitchInbox from './PitchInbox';
import { PITCHES } from './constants';
import styles from './pitches.module.css';

export default function PitchesPage() {
  return (
    <div className={styles.shell}>
      <Header />
      <PitchInbox pitches={PITCHES} />
    </div>
  );
}
