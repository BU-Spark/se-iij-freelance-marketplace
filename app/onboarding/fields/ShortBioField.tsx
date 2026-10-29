import { Field, Section } from '../../components';
import type { ProfileData, ProfileUpdate } from '../../types/onboarding.types';

const LIMIT = 280;

type ShortBioFieldProps = {
  placeholder: string;
  data: ProfileData;
  update: ProfileUpdate;
};

export default function ShortBioField({ placeholder, data, update }: ShortBioFieldProps) {
  return (
    <Section title="Short bio" color="var(--c-blue)">
      <Field label={`About you · ${data.shortBio.length}/${LIMIT}`}>
        <textarea
          rows={4}
          maxLength={LIMIT}
          value={data.shortBio}
          onChange={(e) => update('shortBio', e.target.value)}
          placeholder={placeholder}
        />
      </Field>
    </Section>
  );
}
