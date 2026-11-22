import { Field, Section, TagInput } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import PhotoField from '../../fields/PhotoField';
import ShortBioField from '../../fields/ShortBioField';
import { BEAT_OTHER, MEDIUMS, SKILLS } from '../../constants';
import { fieldError } from '../../helpers';
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
  /** The beats the team currently offers, in the order the picker shows them */
  beatOptions: string[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  onBack: () => void;
  /** label says "Change role", so this jumps back to the picker instead of the age gate */
  onBackToRoles?: () => void;
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
      onBackToRoles={p.onBackToRoles}
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
          <PhotoField data={data} update={update} />
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

      <Section
        title="Beats"
        hint="Search the beats you cover and add as many as apply."
        color="var(--c-amber)"
        error={err('reportingBeats')}
      >
        <TagInput
          tags={data.reportingBeats}
          onChange={(tags) => {
            update('reportingBeats', tags);
            touch('reportingBeats');
          }}
          suggestions={p.beatOptions}
          allowCustom={false}
          ariaLabel="Search beats"
          placeholder="Search beats…"
        />
        {data.reportingBeats.includes(BEAT_OTHER) && (
          <div className={shared.spaced}>
            <Field label="Your beat" error={err('beatOther')}>
              <input
                value={data.beatOther}
                placeholder="Water rights in the Central Valley"
                onChange={(e) => update('beatOther', e.target.value)}
                onBlur={() => touch('beatOther')}
              />
            </Field>
          </div>
        )}
      </Section>

      <Section title="Skills" hint="Search how you do it and add as many as apply." color="var(--c-sky)">
        <TagInput
          tags={data.skills}
          onChange={(tags) => update('skills', tags)}
          suggestions={SKILLS}
          allowCustom={false}
          ariaLabel="Search skills"
          placeholder="Search skills…"
        />
      </Section>

      <Section title="Mediums" hint="How do you tell stories?" color="var(--c-red)" error={err('workMediums')}>
        <TagInput
          tags={data.workMediums}
          onChange={(tags) => {
            update('workMediums', tags);
            touch('workMediums');
          }}
          suggestions={MEDIUMS}
          allowCustom={false}
          ariaLabel="Search mediums"
          placeholder="Search mediums…"
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
