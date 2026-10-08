import styles from './PreviewCard.module.css';
import { AVAILABILITY, CHIP_COLORS } from '../onboarding/constants';
import type { Organization, ProfileData, Role } from '../types/onboarding.types';

type PreviewCardProps = {
  role: Role;
  data: ProfileData;
  org?: Organization;
};

export default function PreviewCard({ role, data, org }: PreviewCardProps) {
  const initials =
    data.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';

  const tags = role === 'editor' ? data.desks : [...data.beats, ...data.mediums];
  const avail = AVAILABILITY.find((a) => a.value === data.availability)!;

  return (
    <div className={styles.preview}>
      <div className={styles.previewBanner} />
      <div className={styles.avatar}>{initials}</div>
      <h4>{data.fullName || 'Your name'}</h4>
      <p className={styles.previewMeta}>
        {role === 'editor'
          ? `${data.title || 'Your title'} · ${org?.name ?? 'Your newsroom'}`
          : `Freelancer${data.location ? ` · ${data.location}` : ''}`}
      </p>

      {role === 'freelancer' && (
        <span className={styles.previewAvail} style={{ ['--accent' as string]: avail.color }}>
          <span className={styles.pulseDot} /> {avail.label}
        </span>
      )}

      {data.bio && <p className={styles.previewBio}>{data.bio}</p>}

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
