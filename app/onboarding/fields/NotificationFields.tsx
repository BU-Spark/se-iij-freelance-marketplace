import { ChipGroup, Section } from '../../components';
import shared from '../onboarding.module.css';
import styles from './Fields.module.css';
import { LANGUAGES, THEMES } from '../constants';
import { singleChoice } from '../helpers';
import type { ProfileData, ProfileUpdate } from '../../types/onboarding.types';

type NotificationFieldsProps = {
  /** Role-specific wording for the email opt-in */
  emailLabel: string;
  data: ProfileData;
  update: ProfileUpdate;
};

/** Theme, language and notification opt-ins, shared by the editor and freelancer flows */
export default function NotificationFields({ emailLabel, data, update }: NotificationFieldsProps) {
  const theme = singleChoice(THEMES, data.theme);

  return (
    <Section title="Notifications & display" color="var(--c-purple)">
      <p className={shared.groupLabel}>Theme</p>
      <ChipGroup
        options={theme.options}
        selected={theme.selected}
        onToggle={(label) => update('theme', theme.toId(label))}
      />

      <div className={shared.spaced}>
        <p className={shared.groupLabel}>Language</p>
        <ChipGroup
          options={LANGUAGES}
          selected={[data.language]}
          onToggle={(language) => update('language', language)}
        />
      </div>

      <div className={styles.toggles}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={data.emailNotifications}
            onChange={(e) => update('emailNotifications', e.target.checked)}
          />
          <span>{emailLabel}</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={data.pushNotifications}
            onChange={(e) => update('pushNotifications', e.target.checked)}
          />
          <span>Send me browser notifications</span>
        </label>
      </div>
    </Section>
  );
}
