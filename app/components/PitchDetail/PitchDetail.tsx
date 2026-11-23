import Avatar from '../Avatar/Avatar';
import ReportButton from '../ReportButton/ReportButton';
import type { Pitch } from '../../types/dashboard.types';
import { categoryColor } from '../../utils/category.utils';
import { pitchHeading } from '../../utils/pitch.utils';
import { timeAgo } from '../../utils/dashboard.utils';
import styles from './PitchDetail.module.css';
import { PITCH_FACTS } from './pitchFields';

type PitchDetailProps = {
  pitch: Pitch;
  /** editors can flag a pitch from their inbox; a freelancer reading their own does not need it */
  showReport?: boolean;
};

export default function PitchDetail({ pitch, showReport = false }: PitchDetailProps) {
  return (
    <article className={styles.detail}>
      <header className={styles.head}>
        <div className={styles.headTop}>
          <div className={styles.tags}>
            <span className={styles.category}>
              <span className={styles.dot} style={{ background: categoryColor(pitch.category) }} aria-hidden="true" />
              {pitch.category}
            </span>
            {pitch.tags.map((t) => (
              <span key={t} className={styles.tag}>
                {t}
              </span>
            ))}
          </div>
          {showReport && (
            <ReportButton targetType="pitch" targetId={pitch.id} targetLabel={pitchHeading(pitch.slug)} compact />
          )}
        </div>

        <h2 className={styles.title}>{pitchHeading(pitch.slug)}</h2>

        <div className={styles.by}>
          <Avatar name={pitch.freelancer.name} size={40} />
          <div>
            <p className={styles.name}>{pitch.freelancer.name}</p>
            <p className={styles.when}>Submitted {timeAgo(pitch.submittedAt)}</p>
          </div>
        </div>
      </header>

      <p className={styles.summary}>{pitch.summary}</p>

      <dl className={styles.facts}>
        {PITCH_FACTS.map((f) => (
          <div key={f.key}>
            <dt>{f.label}</dt>
            <dd>{String(pitch[f.key]) || 'Not specified'}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="pitch-description">
        <h3 id="pitch-description" className={styles.sectionTitle}>
          Description
        </h3>
        <p className={styles.description}>{pitch.description || 'No description yet.'}</p>
      </section>
    </article>
  );
}
