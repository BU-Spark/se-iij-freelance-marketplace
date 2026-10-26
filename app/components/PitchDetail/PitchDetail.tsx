import Avatar from '../Avatar/Avatar';
import type { Pitch } from '../../types/dashboard.types';
import { categoryColor } from '../../utils/category.utils';
import { timeAgo } from '../../utils/dashboard.utils';
import styles from './PitchDetail.module.css';

type PitchDetailProps = {
  pitch: Pitch;
};

export default function PitchDetail({ pitch }: PitchDetailProps) {
  // the four quick facts in a row
  const facts = [
    { label: 'Location', value: pitch.location },
    { label: 'Length', value: pitch.length },
    { label: 'Deadline', value: pitch.deadline },
    { label: 'Rate', value: pitch.rate },
  ];

  // the longer answers the freelancer gave, shown one under another
  const sections = [
    { label: 'Potential sources', value: pitch.sources },
    { label: 'Audience', value: pitch.audience },
    { label: 'Assets', value: pitch.assets },
    { label: "Why it's a fit for the publication", value: pitch.whyFit },
    { label: "Why they're the right person", value: pitch.whyMe },
  ];

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
        {facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <dl className={styles.sections}>
        {sections.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
