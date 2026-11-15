import Avatar from '../../../components/Avatar/Avatar';
import { ORGANIZATIONS } from '../organizations/constants';
import type { EditorProfile } from './constants';
import styles from './editors.module.css';

/** One editor in the Editors grid: who they are, which newsroom and desks, and how to reach them */
export default function EditorCard({ editor }: { editor: EditorProfile }) {
  const org = ORGANIZATIONS.find((item) => item.id === editor.organizationId);

  return (
    <>
      <Avatar name={editor.name} size={48} />

      <div className={styles.body}>
        <div className={styles.heading}>
          <h2 className={styles.name}>{editor.name}</h2>
          <p className={styles.role}>{editor.role}</p>
        </div>

        {org && (
          <p className={styles.org}>
            {org.name} <span className={styles.city}>· {org.city}</span>
          </p>
        )}

        <ul className={styles.desks} aria-label="Desks">
          {editor.desks.map((desk) => (
            <li key={desk} className={styles.desk}>
              {desk}
            </li>
          ))}
        </ul>

        <a className={styles.email} href={`mailto:${editor.email}`}>
          {editor.email}
        </a>
      </div>
    </>
  );
}
