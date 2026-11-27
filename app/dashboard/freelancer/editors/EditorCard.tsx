import RosterCardLayout from '../../../components/RosterCard/RosterCardLayout';
import talentStyles from '../../talent/talent.module.css';
import { ORGANIZATIONS } from '../organizations/constants';
import type { EditorProfile } from './constants';
import styles from './editors.module.css';

/** One editor in the Editors grid: who they are, which newsroom and desks, and how to reach them */
export default function EditorCard({ editor }: { editor: EditorProfile }) {
  const org = ORGANIZATIONS.find((item) => item.id === editor.organizationId);

  return (
    <RosterCardLayout
      name={editor.name}
      meta={editor.role}
      className={styles.card}
      footer={
        <a className={talentStyles.toggle} href={`mailto:${editor.email}`}>
          {editor.email}
        </a>
      }
    >
      {org && (
        <dl className={talentStyles.facts}>
          <div>
            <dt>Newsroom</dt>
            <dd>{org.name}</dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{org.city}</dd>
          </div>
        </dl>
      )}

      <ul className={talentStyles.chipList} aria-label="Desks">
        {editor.desks.map((desk) => (
          <li key={desk} className={talentStyles.medium}>
            {desk}
          </li>
        ))}
      </ul>
    </RosterCardLayout>
  );
}
