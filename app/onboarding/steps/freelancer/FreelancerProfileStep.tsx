import { ChipGroup, Field, Section, TagInput } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import ShortBioField from '../../fields/ShortBioField';
import { MEDIUMS, TOPICS } from '../../constants';
import { fieldError, toggleValue } from '../../helpers';
import type {
  OrgOption,
  ProfileData,
  ProfileErrors,
  ProfileTouch,
  ProfileUpdate,
  Touched,
} from '../../../types/onboarding.types';

type FreelancerProfileStepProps = {
  data: ProfileData;
  orgs: OrgOption[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  onBack: () => void;
  onNext: () => void;
  /** Name, email and location belong to the account, so only the first profile step collects them */
  showBasics?: boolean;
};

/** Freelancer step 2: who they are and what they report on */
export default function FreelancerProfileStep(p: FreelancerProfileStepProps) {
  const { data, update, touch } = p;
  const err = fieldError(p.errors, p.touched);

  const text = (key: 'firstName' | 'lastName' | 'email' | 'location', placeholder: string) => (
    <input
      type={key === 'email' ? 'email' : 'text'}
      value={data[key]}
      placeholder={placeholder}
      onChange={(e) => update(key, e.target.value)}
      onBlur={() => touch(key)}
    />
  );

  return (
    <FormStep
      role="freelancer"
      backLabel="← Change role"
      onBack={p.onBack}
      title="Your reporting"
      lead="Editors see this when they're deciding who to assign."
      data={data}
      orgs={p.orgs}
      shake={p.shake}
      submitLabel="Continue →"
      onSubmit={p.onNext}
    >
      {p.showBasics !== false && (
        <Section title="Basics" color="var(--c-green)">
          <div className={shared.grid2}>
            <Field label="First name" error={err('firstName')}>
              {text('firstName', 'Alex')}
            </Field>
            <Field label="Last name" error={err('lastName')}>
              {text('lastName', 'Rivera')}
            </Field>
            <Field label="Email" error={err('email')}>
              {text('email', 'you@example.com')}
            </Field>
            <Field label="Based in">{text('location', 'Boston, MA')}</Field>
          </div>
        </Section>
      )}

      <Section title="Beats" hint="What do you cover?" color="var(--c-amber)" error={err('reportingBeats')}>
        <ChipGroup
          options={TOPICS}
          selected={data.reportingBeats}
          onToggle={(value) => {
            update('reportingBeats', toggleValue(data.reportingBeats, value));
            touch('reportingBeats');
          }}
        />
      </Section>

      <Section title="Mediums" hint="How do you tell stories?" color="var(--c-red)" error={err('workMediums')}>
        <ChipGroup
          options={MEDIUMS}
          selected={data.workMediums}
          onToggle={(value) => {
            update('workMediums', toggleValue(data.workMediums, value));
            touch('workMediums');
          }}
        />
      </Section>

      <Section title="Tools" hint="Type a tool and press Enter." color="var(--c-purple)">
        <TagInput tags={data.tools} onChange={(tags) => update('tools', tags)} />
      </Section>

      <Section title="Clips" color="var(--c-sky)">
        <Field label="Portfolio link" error={err('portfolio')}>
          <input
            value={data.portfolio[0]?.url ?? ''}
            placeholder="https://yourportfolio.com"
            onChange={(e) => {
              const url = e.target.value;
              update('portfolio', url ? [{ id: 'portfolio-link', type: 'article', title: 'Portfolio', url }] : []);
            }}
            onBlur={() => touch('portfolio')}
          />
        </Field>
      </Section>

      <ShortBioField data={data} update={update} placeholder="What makes your reporting stand out?" />
    </FormStep>
  );
}
