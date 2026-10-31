import { ChipGroup, Field, Section, TagInput } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import AvailabilityFields from '../../fields/AvailabilityFields';
import LongBioField from '../../fields/LongBioField';
import NotificationFields from '../../fields/NotificationFields';
import { PITCH_FORMATS, TOPICS } from '../../constants';
import { fieldError, toggleValue } from '../../helpers';
import type {
  OrgOption,
  ProfileData,
  ProfileErrors,
  ProfileTouch,
  ProfileUpdate,
  Touched,
} from '../../../types/onboarding.types';

/** ChipGroup needs a way back to "not set", so an explicit option stands in for the empty string */
const NO_PREFERENCE = 'No preference';
const PITCH_OPTIONS = [NO_PREFERENCE, ...PITCH_FORMATS];

type EditorPreferencesStepProps = {
  data: ProfileData;
  orgs: OrgOption[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  submitting: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  onBack: () => void;
  onSubmit: () => void;
  submitError: string | null;
};

/** Editor step 3: how they want to be pitched, when they're around, and their settings */
export default function EditorPreferencesStep(p: EditorPreferencesStepProps) {
  const { data, update, touch } = p;
  const err = fieldError(p.errors, p.touched);

  return (
    <FormStep
      role="editor"
      backLabel="← Back to your newsroom"
      onBack={p.onBack}
      title="How you work"
      lead="Everything here is optional — freelancers use it to decide whether a pitch fits before they send it."
      data={data}
      orgs={p.orgs}
      shake={p.shake}
      submitLabel="Create profile →"
      onSubmit={p.onSubmit}
      submitting={p.submitting}
      submitError={p.submitError}
    >
      <Section
        title="How you like pitches"
        hint="Freelancers see this before they send you anything."
        color="var(--c-blue)"
      >
        <p className={shared.groupLabel}>Preferred pitch format</p>
        <ChipGroup
          options={PITCH_OPTIONS}
          selected={[data.preferredPitchFormat || NO_PREFERENCE]}
          onToggle={(format) => update('preferredPitchFormat', format === NO_PREFERENCE ? '' : format)}
        />
        <div className={shared.spaced}>
          <Field label="Average response time (days)" error={err('averageResponseTime')}>
            <input
              type="number"
              min={0}
              value={data.averageResponseTime}
              onChange={(e) => update('averageResponseTime', e.target.valueAsNumber || 0)}
              onBlur={() => touch('averageResponseTime')}
            />
          </Field>
        </div>
      </Section>

      <Section title="Topics you want" hint="What should freelancers bring you?" color="var(--c-amber)">
        <ChipGroup
          options={TOPICS}
          selected={data.interestedTopics}
          onToggle={(value) => {
            update('interestedTopics', toggleValue(data.interestedTopics, value));
            touch('interestedTopics');
          }}
        />
      </Section>

      <Section title="Editorial preferences" hint="Type a preference and press Enter." color="var(--c-purple)">
        <TagInput
          tags={data.editorialPreferences}
          onChange={(tags) => update('editorialPreferences', tags)}
          placeholder="Long-form only, no first-person, data-backed…"
        />
      </Section>

      <Section title="What you're looking for" hint="Type an ask and press Enter." color="var(--c-red)">
        <TagInput
          tags={data.lookingFor}
          onChange={(tags) => update('lookingFor', tags)}
          placeholder="Accountability reporting, local election coverage…"
        />
      </Section>

      <AvailabilityFields
        title="When you're at your desk"
        hint="Freelancers use this to time their pitches and deadlines."
        color="var(--c-green)"
        data={data}
        error={err('workdayEnd')}
        update={update}
        touch={touch}
      />

      <NotificationFields emailLabel="Email me about new pitches" data={data} update={update} />

      <LongBioField
        data={data}
        update={update}
        placeholder="Your newsroom, the stories you commission, and how you like to work with freelancers."
      />
    </FormStep>
  );
}
