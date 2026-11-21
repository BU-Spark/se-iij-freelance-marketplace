import { EditorIcon } from '../../components/icons/EditorIcon';
import { FreelancerIcon } from '../../components/icons/FreelancerIcon';
import shared from '../onboarding.module.css';
import styles from './RoleStep.module.css';
import type { OnboardingRole } from '../../types/onboarding.types';

const ROLES: {
  id: OnboardingRole;
  title: string;
  accent: string;
  Icon: typeof EditorIcon;
  desc: string;
  cta: string;
}[] = [
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

type RoleStepProps = {
  selected: OnboardingRole[];
  /** Roles already on the saved profile; they are not offered again when adding another one */
  held?: OnboardingRole[];
  onToggle: (role: OnboardingRole) => void;
  onNext: () => void;
  error?: string;
};

export default function RoleStep({ selected, held = [], onToggle, onNext, error }: RoleStepProps) {
  const offered = ROLES.filter(({ id }) => !held.includes(id));

  return (
    <section className={`${shared.narrow} ${shared.fadeIn}`}>
      <h1 className={shared.h1}>Welcome aboard</h1>
      <p className={shared.lead}>
        {held.length > 0
          ? 'Add the other role you work in. Everything you have already set up stays as it is.'
          : 'The assignment desk that connects newsroom editors with the independent journalists who can take the work. Pick the roles you work in — you can choose both.'}
      </p>

      <div className={styles.roleGrid}>
        {offered.map(({ id, title, accent, Icon, desc, cta }) => {
          const active = selected.includes(id);

          return (
            <button
              key={id}
              className={styles.roleCard}
              style={{ ['--accent' as string]: accent }}
              data-active={active}
              aria-pressed={active}
              onClick={() => onToggle(id)}
            >
              <span className={styles.roleIcon}>
                <Icon />
              </span>
              <h2>{title}</h2>
              <p>{desc}</p>
              <span className={styles.roleLink}>
                {active ? 'Selected' : cta} <span className={styles.arrow}>{active ? '✓' : '→'}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className={shared.actions}>
        <button className={shared.primaryBtn} onClick={onNext}>
          Continue →
        </button>
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </section>
  );
}
