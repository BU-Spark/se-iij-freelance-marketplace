import { EDITORS } from './constants';
import EditorCard from './EditorCard';
import styles from './editors.module.css';

export default function EditorsPage() {
  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>Freelancer workspace</p>
          <h1 className={styles.title}>Editors</h1>
          <p className={styles.lede}>
            The editors on the desk, the newsroom they work for and the beats they commission.
          </p>
        </header>

        <ul className={styles.grid}>
          {EDITORS.map((editor) => (
            <li key={editor.id} className={styles.card}>
              <EditorCard editor={editor} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
