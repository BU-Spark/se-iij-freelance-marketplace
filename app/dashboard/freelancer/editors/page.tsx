import { EDITORS } from './constants';
import EditorCard from './EditorCard';
import pageStyles from '../freelancer.module.css';
import styles from './editors.module.css';

export default function EditorsPage() {
  return (
    <main className={pageStyles.main}>
      <div className={styles.intro}>
        <p className={pageStyles.eyebrow}>Freelancer workspace</p>
        <h1>Editors</h1>
        <p>The editors on the desk, the newsroom they work for and the beats they commission.</p>
      </div>

      <ul className={styles.grid}>
        {EDITORS.map((editor) => (
          <li key={editor.id} className={styles.card}>
            <EditorCard editor={editor} />
          </li>
        ))}
      </ul>
    </main>
  );
}
