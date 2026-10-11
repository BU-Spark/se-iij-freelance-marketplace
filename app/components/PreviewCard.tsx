import styles from './PreviewCard.module.css';
import { CHIP_COLORS } from '../onboarding/constants';
import type { OnboardingRole, OrgOption, ProfileData } from '../types/onboarding.types';

type PreviewCardProps = {
  role: OnboardingRole;
  data: ProfileData;
  org?: OrgOption;
};

export default function PreviewCard({ role, data, org }: PreviewCardProps) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const initials =
    [data.firstName, data.lastName]
      .map((n) => n.trim()[0]?.toUpperCase())
      .filter(Boolean)
      .join('') || '?';

  const tags = role === 'editor' ? data.desks : [...data.reportingBeats, ...data.workMediums];

  return (
    <div className={styles.preview}>
      <div className={styles.previewBanner} />
      <div className={styles.avatar}>{initials}</div>
      <h4>{fullName || 'Your name'}</h4>
      <p className={styles.previewMeta}>
        {role === 'editor'
          ? `${data.jobTitle || 'Your title'} · ${org?.name ?? 'Your newsroom'}`
          : `Freelancer${data.location ? ` · ${data.location}` : ''}`}
      </p>

      {data.shortBio && <p className={styles.previewBio}>{data.shortBio}</p>}

      <div className={styles.previewTags}>
        {tags.length ? (
          tags.map((t, i) => (
            <span key={t} style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}>
              {t}
            </span>
          ))
        ) : (
          <em>{role === 'editor' ? 'Desks appear here' : 'Beats & mediums appear here'}</em>
        )}
      </div>
    </div>
  );
}
