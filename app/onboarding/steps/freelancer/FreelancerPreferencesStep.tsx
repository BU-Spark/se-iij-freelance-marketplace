import { ChipGroup, Field, Section, TagInput } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import AvailabilityFields from '../../fields/AvailabilityFields';
import LongBioField from '../../fields/LongBioField';
import NotificationFields from '../../fields/NotificationFields';
import { RATE_UNITS } from '../../constants';
import { fieldError, singleChoice } from '../../helpers';
import type {
  OrgOption,
  ProfileData,
  ProfileErrors,
  ProfileTouch,
  ProfileUpdate,
  Touched,
} from '../../../types/onboarding.types';

type FreelancerPreferencesStepProps = {
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
  /** The final step creates the profile; earlier steps just continue */
  submitLabel?: string;
};

/** Freelancer step 3: what they charge, when they're free, and their settings */
export default function FreelancerPreferencesStep(p: FreelancerPreferencesStepProps) {
  const { data, update, touch } = p;
  const err = fieldError(p.errors, p.touched);
  const unit = singleChoice(RATE_UNITS, data.rateUnit);

  return (
    <FormStep
      role="freelancer"
      backLabel="← Back to your reporting"
      onBack={p.onBack}
      title="Rates & availability"
      lead="Everything here is optional — editors use it to judge fit and timing before they assign work."
      data={data}
      orgs={p.orgs}
      shake={p.shake}
      submitLabel={p.submitLabel ?? 'Create profile →'}
      onSubmit={p.onSubmit}
      submitting={p.submitting}
      submitError={p.submitError}
    >
      <Section
        title="Rates & coverage"
        hint="Leave the rate blank if you'd rather talk it through."
        color="var(--c-blue)"
      >
        <div className={shared.grid2}>
          <Field label="Your rate" error={err('rateAmount')}>
            <input
              inputMode="decimal"
              value={data.rateAmount}
              placeholder="0.75"
              onChange={(e) => update('rateAmount', e.target.value)}
              onBlur={() => touch('rateAmount')}
            />
          </Field>
        </div>
        <div className={shared.spaced}>
          <p className={shared.groupLabel}>Charged</p>
          <ChipGroup
            options={unit.options}
            selected={unit.selected}
            onToggle={(label) => update('rateUnit', unit.toId(label))}
          />
        </div>
        <div className={shared.spaced}>
          <Field label="Communities you cover">
            <input
              value={data.communityCovered}
              placeholder="Latino communities in South Texas"
              onChange={(e) => update('communityCovered', e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Beat tags" hint="Narrower than your beats — type a tag and press Enter." color="var(--c-amber)">
        <TagInput
          tags={data.beatTags}
          onChange={(tags) => update('beatTags', tags)}
          placeholder="Housing, Water rights, School boards…"
        />
      </Section>

      <AvailabilityFields
        title="Availability"
        hint="Pick the days you can take work and your usual hours."
        color="var(--c-green)"
        data={data}
        error={err('workdayEnd')}
        update={update}
        touch={touch}
      />

      <NotificationFields emailLabel="Email me about new assignments" data={data} update={update} />

      <LongBioField
        data={data}
        update={update}
        placeholder="Your reporting background, notable work, and the stories you want to take on next."
      />
    </FormStep>
  );
}
