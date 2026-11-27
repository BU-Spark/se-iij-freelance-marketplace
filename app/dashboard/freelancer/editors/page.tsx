import rosterStyles from '../../roster/roster.module.css';
import { EDITORS } from './constants';
import EditorCard from './EditorCard';

export default function EditorsPage() {
  return (
    <div className={rosterStyles.shell}>
      <main className={rosterStyles.main}>
        <header className={rosterStyles.heading}>
          <div>
            <p className={rosterStyles.eyebrow}>Freelancer workspace</p>
            <h1 className={rosterStyles.title}>Editors</h1>
            <p className={rosterStyles.description}>
              The editors on the desk, the newsroom they work for and the beats they commission.
            </p>
          </div>
        </header>

        <ul className={rosterStyles.grid}>
          {EDITORS.map((editor) => (
            <li key={editor.id}>
              <EditorCard editor={editor} />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
