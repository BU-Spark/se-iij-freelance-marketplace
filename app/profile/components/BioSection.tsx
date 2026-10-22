import { Field, Section } from '../../components';
import styles from '../profile.module.css';

type Props = {
  shortBio: string;
  fullBio: string;
  onChange: (key: 'shortBio' | 'fullBio', value: string) => void;
};

export function BioSection({ shortBio, fullBio, onChange }: Props) {
  return (
    <Section title="Your bio" color="var(--c-blue)">
      <Field label="One-line bio">
        <input
          value={shortBio}
          onChange={(event) => onChange('shortBio', event.target.value)}
          placeholder="Runs the metro desk. Loves accountability reporting."
        />
      </Field>
      <div className={styles.bioFull}>
        <Field label="Full bio">
          <textarea
            rows={5}
            value={fullBio}
            onChange={(event) => onChange('fullBio', event.target.value)}
            placeholder="How you came up, what your desk covers, and what gets your attention fastest."
          />
        </Field>
      </div>
    </Section>
  );
}
