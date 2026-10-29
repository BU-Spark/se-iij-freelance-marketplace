import { Field, Section } from '../../components';
import shared from '../onboarding.module.css';
import styles from './Fields.module.css';
import { WEEKDAYS } from '../constants';
import type { Weekday } from '../../types/availability.types';
import type { ProfileData, ProfileTouch, ProfileUpdate } from '../../types/onboarding.types';

type AvailabilityFieldsProps = {
  title: string;
  hint: string;
  color: string;
  data: ProfileData;
  error?: string;
  update: ProfileUpdate;
  touch: ProfileTouch;
};

/** Weekday picker + working window, shared by the editor and freelancer flows */
export default function AvailabilityFields({
  title,
  hint,
  color,
  data,
  error,
  update,
  touch,
}: AvailabilityFieldsProps) {
  const toggleDay = (day: Weekday) => {
    const days = data.availableDays.includes(day)
      ? data.availableDays.filter((d) => d !== day)
      : [...data.availableDays, day];
    update('availableDays', days);
    touch('availableDays');
  };

  return (
    <Section title={title} hint={hint} color={color}>
      <div className={styles.days}>
        {WEEKDAYS.map(({ id, label, short }) => (
          <button
            key={id}
            type="button"
            className={styles.day}
            aria-label={label}
            aria-pressed={data.availableDays.includes(id)}
            data-active={data.availableDays.includes(id)}
            onClick={() => toggleDay(id)}
          >
            {short}
          </button>
        ))}
      </div>
      <div className={shared.grid2}>
        <Field label="Starts at">
          <input
            type="time"
            value={data.workdayStart}
            onChange={(e) => update('workdayStart', e.target.value)}
            onBlur={() => touch('workdayStart')}
          />
        </Field>
        <Field label="Ends at" error={error}>
          <input
            type="time"
            value={data.workdayEnd}
            onChange={(e) => update('workdayEnd', e.target.value)}
            onBlur={() => touch('workdayEnd')}
          />
        </Field>
        <Field label="Timezone">
          <input
            value={data.timezone}
            placeholder="America/New_York"
            onChange={(e) => update('timezone', e.target.value)}
          />
        </Field>
      </div>
    </Section>
  );
}
