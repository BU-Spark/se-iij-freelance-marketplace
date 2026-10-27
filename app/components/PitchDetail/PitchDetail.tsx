import Avatar from '../Avatar/Avatar';
import type { Pitch } from '../../types/dashboard.types';
import { categoryColor } from '../../utils/category.utils';
import { timeAgo } from '../../utils/dashboard.utils';
import styles from './PitchDetail.module.css';
import { PITCH_FACTS, PITCH_SECTIONS } from './pitchFields';

type PitchDetailProps = {
  pitch: Pitch;
};

export default function PitchDetail({ pitch }: PitchDetailProps) {
  return (
    <article className={styles.detail}>
      <header className={styles.head}>
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

        <h2 className={styles.title}>{pitch.slug}</h2>

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
            <dd>{String(pitch[f.key])}</dd>
          </div>
        ))}
      </dl>

      <dl className={styles.sections}>
        {PITCH_SECTIONS.map((s) => (
          <div key={s.key}>
            <dt>{s.label}</dt>
            <dd>{String(pitch[s.key])}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
