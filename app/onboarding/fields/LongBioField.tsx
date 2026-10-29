import { Field, Section } from '../../components';
import type { ProfileData, ProfileUpdate } from '../../types/onboarding.types';

const LIMIT = 1200;

type LongBioFieldProps = {
  placeholder: string;
  data: ProfileData;
  update: ProfileUpdate;
};

export default function LongBioField({ placeholder, data, update }: LongBioFieldProps) {
  return (
    <Section title="More about you" hint="A longer bio than your 280-character summary." color="var(--c-sky)">
      <Field label={`Long bio · ${data.longBio.length}/${LIMIT}`}>
        <textarea
          rows={6}
          maxLength={LIMIT}
          value={data.longBio}
          onChange={(e) => update('longBio', e.target.value)}
          placeholder={placeholder}
        />
      </Field>
    </Section>
  );
}
