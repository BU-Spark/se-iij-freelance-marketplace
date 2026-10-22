import { Field, Section } from '../../components';
import type { EditorProfileDraft } from '../profile.types';
import styles from '../profile.module.css';

type Props = {
  values: EditorProfileDraft;
  onChange: (key: 'fullName' | 'email' | 'position' | 'yearsAtDesk', value: string) => void;
};

export function BasicsSection({ values, onChange }: Props) {
  return (
    <Section title="Basics" color="var(--c-green)">
      <div className={styles.twoColumns}>
        <Field label="Full name">
          <input
            value={values.fullName}
            onChange={(event) => onChange('fullName', event.target.value)}
            placeholder="Sarah Jenkins"
          />
        </Field>
        <Field label="Work email">
          <input
            type="email"
            value={values.email}
            onChange={(event) => onChange('email', event.target.value)}
            placeholder="you@newsroom.example"
          />
        </Field>
        <Field label="Position / title">
          <input
            value={values.position}
            onChange={(event) => onChange('position', event.target.value)}
            placeholder="News Editor"
          />
        </Field>
        <Field label="Years at desk">
          <input
            value={values.yearsAtDesk}
            onChange={(event) => onChange('yearsAtDesk', event.target.value)}
            placeholder="4 years at desk · 18 in journalism"
          />
        </Field>
      </div>
    </Section>
  );
}
