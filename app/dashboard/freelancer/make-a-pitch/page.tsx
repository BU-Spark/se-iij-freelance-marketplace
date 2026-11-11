import { PitchComposer } from '../../../components/PitchForm';
import styles from '../freelancer.module.css';

export default function MakePitchPage() {
  return (
    <main className={styles.main}>
      <h1>Make a pitch</h1>
      <p>Describe your story, propose compensation, and review your pitch.</p>
      <p>
        Drafts are saved only in this browser for your account. Sending pitches and collaborator invitations is not
        connected yet.
      </p>
      <PitchComposer />
    </main>
  );
}
