import Link from 'next/link';
import { PreviewCard } from '../../components';
import shared from '../onboarding.module.css';
import styles from './DoneStep.module.css';
import { CHIP_COLORS } from '../constants';
import type { OnboardingRole, OrgOption, ProfileData } from '../../types/onboarding.types';

type DoneStepProps = {
  roles: OnboardingRole[];
  data: ProfileData;
  org?: OrgOption;
  onEdit: () => void;
};

export default function DoneStep({ roles, data, org, onEdit }: DoneStepProps) {
  const isEditor = roles.includes('editor');
  const lead =
    roles.length > 1
      ? 'Both profiles are live — you can commission work as an editor and pitch your own as a freelancer.'
      : isEditor
        ? 'Your editor profile is live. Freelancers can now find you and start pitching.'
        : 'Your freelancer profile is live. Editors can now see your beats and availability.';

  return (
    <section className={`${shared.narrow} ${styles.done}`}>
      <div className={styles.confetti} aria-hidden="true">
        {CHIP_COLORS.concat(CHIP_COLORS).map((c, i) => (
          <span key={i} style={{ background: c, left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 90}ms` }} />
        ))}
      </div>

      <div className={styles.checkRing}>
        <svg viewBox="0 0 52 52" width="56" height="56">
          <path
            d="M14 27 l8 8 l16 -18"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className={shared.h1}>You&apos;re all set, {data.firstName.trim()}!</h1>
      <p className={`${shared.lead} ${styles.centerLead}`}>{lead}</p>

      <div className={styles.doneCards}>
        {roles.map((role) => (
          <div key={role} className={styles.doneCard}>
            <PreviewCard role={role} data={data} org={org} />
          </div>
        ))}
      </div>

      <div className={shared.actions} style={{ justifyContent: 'center' }}>
        <button className={shared.secondaryBtn} onClick={onEdit}>
          Edit profile
        </button>
        {/* TODO: send freelancers to their own page once it exists */}
        <Link href={isEditor ? '/dashboard' : '/dashboard/assignments'} className={shared.primaryBtn}>
          {isEditor ? 'Post first assignment →' : 'Browse assignments →'}
        </Link>
      </div>
    </section>
  );
}
