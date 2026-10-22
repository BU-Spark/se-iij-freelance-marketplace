import { Field, Section, TagInput } from '../../components';
import type { EditorProfileDraft } from '../profile.types';
import styles from '../profile.module.css';

type Props = {
  values: EditorProfileDraft;
  onTextChange: (key: 'preferredPitchFormat' | 'averageResponseTime', value: string) => void;
  onTagsChange: (key: 'lookingFor' | 'editorialPreferences' | 'interestedTopics', tags: string[]) => void;
};

export function PitchPreferencesSection({ values, onTextChange, onTagsChange }: Props) {
  return (
    <Section title="How you like to be pitched" color="var(--c-purple)">
      <div className={styles.twoColumns}>
        <Field label="Preferred pitch format">
          <input
            value={values.preferredPitchFormat}
            onChange={(event) => onTextChange('preferredPitchFormat', event.target.value)}
            placeholder="3-paragraph pitch, top graf reads like a lede."
          />
        </Field>
        <Field label="Typical response time">
          <input
            value={values.averageResponseTime}
            onChange={(event) => onTextChange('averageResponseTime', event.target.value)}
            placeholder="Usually replies within 24 hours"
          />
        </Field>
      </div>
      <div className={styles.preferenceField}>
        <Field label="What you're looking for right now">
          <TagInput tags={values.lookingFor} onChange={(tags) => onTagsChange('lookingFor', tags)} />
        </Field>
      </div>
      <div className={styles.preferenceField}>
        <Field label="Editorial preferences">
          <TagInput
            tags={values.editorialPreferences}
            onChange={(tags) => onTagsChange('editorialPreferences', tags)}
          />
        </Field>
      </div>
      <div className={styles.preferenceField}>
        <Field label="Beats & topics you care about">
          <TagInput tags={values.interestedTopics} onChange={(tags) => onTagsChange('interestedTopics', tags)} />
        </Field>
      </div>
    </Section>
  );
}
