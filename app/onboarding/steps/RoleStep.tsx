import { EditorIcon } from '../../components/icons/EditorIcon';
import { FreelancerIcon } from '../../components/icons/FreelancerIcon';
import shared from '../onboarding.module.css';
import styles from './RoleStep.module.css';
import type { Role } from '../../types/onboarding.types';

const ROLES: { id: Role; title: string; accent: string; Icon: typeof EditorIcon; desc: string; cta: string }[] = [
  {
    id: 'editor',
    title: "I'm an editor",
    accent: 'var(--c-blue)',
    Icon: EditorIcon,
    desc: "Post assignments, see who's available today, review pitches, and assign the freelancers who signal interest.",
    cta: 'Set up editor profile',
  },
  {
    id: 'freelancer',
    title: "I'm a freelancer",
    accent: 'var(--c-purple)',
    Icon: FreelancerIcon,
    desc: 'Publish your beats, mediums, tools and clips, keep your availability current, and pitch stories to editors.',
    cta: 'Set up freelancer profile',
  },
];

export default function RoleStep({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <section className={`${shared.narrow} ${shared.fadeIn}`}>
      <h1 className={shared.h1}>Welcome aboard</h1>
      <p className={shared.lead}>
        The assignment desk that connects newsroom editors with the independent journalists who can take the work. Tell
        us which side you&apos;re on and we&apos;ll build your profile.
      </p>

      <div className={styles.roleGrid}>
        {ROLES.map(({ id, title, accent, Icon, desc, cta }) => (
          <button
            key={id}
            className={styles.roleCard}
            style={{ ['--accent' as string]: accent }}
            onClick={() => onPick(id)}
          >
            <span className={styles.roleIcon}>
              <Icon />
            </span>
            <h2>{title}</h2>
            <p>{desc}</p>
            <span className={styles.roleLink}>
              {cta} <span className={styles.arrow}>→</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
