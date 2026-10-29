import { ChipGroup, Field, OrgPicker, Section } from '../../../components';
import shared from '../../onboarding.module.css';
import FormStep from '../FormStep';
import ShortBioField from '../../fields/ShortBioField';
import { TOPICS } from '../../constants';
import { fieldError, toggleValue } from '../../helpers';
import type {
  OrgOption,
  ProfileData,
  ProfileErrors,
  ProfileTouch,
  ProfileUpdate,
  Touched,
} from '../../../types/onboarding.types';

type EditorProfileStepProps = {
  data: ProfileData;
  orgs: OrgOption[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  update: ProfileUpdate;
  touch: ProfileTouch;
  addOrg: (org: OrgOption) => void;
  onBack: () => void;
  onNext: () => void;
};

/** Editor step 2: who they are and which newsroom they commission for */
export default function EditorProfileStep(p: EditorProfileStepProps) {
  const { data, update, touch } = p;
  const err = fieldError(p.errors, p.touched);

  const text = (key: 'firstName' | 'lastName' | 'email' | 'jobTitle' | 'location', placeholder: string) => (
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
      role="editor"
      backLabel="← Change role"
      onBack={p.onBack}
      title="Your newsroom"
      lead="Freelancers see this when they're deciding whether to pitch you."
      data={data}
      orgs={p.orgs}
      shake={p.shake}
      submitLabel="Continue →"
      onSubmit={p.onNext}
    >
      <Section title="Basics" color="var(--c-green)">
        <div className={shared.grid2}>
          <Field label="First name" error={err('firstName')}>
            {text('firstName', 'Sarah')}
          </Field>
          <Field label="Last name" error={err('lastName')}>
            {text('lastName', 'Jenkins')}
          </Field>
          <Field label="Work email" error={err('email')}>
            {text('email', 'you@newsroom.example')}
          </Field>
          <Field label="Based in">{text('location', 'Boston, MA')}</Field>
          <Field label="Position / title" error={err('jobTitle')}>
            {text('jobTitle', 'News Editor')}
          </Field>
          <Field label="Years at desk" error={err('yearsAtDesk')}>
            <input
              type="number"
              min={0}
              value={data.yearsAtDesk}
              onChange={(e) => update('yearsAtDesk', e.target.valueAsNumber || 0)}
              onBlur={() => touch('yearsAtDesk')}
            />
          </Field>
        </div>
      </Section>

      <Section title="Organization" hint="Pick your newsroom, or add one that isn't listed." color="var(--c-amber)">
        <OrgPicker
          orgs={p.orgs}
          selected={data.organizationId}
          onSelect={(id) => update('organizationId', id)}
          onAdd={p.addOrg}
        />
      </Section>

      <Section
        title="Desks you staff"
        hint="Freelancers filter by these when they pitch."
        color="var(--c-red)"
        error={err('desks')}
      >
        <ChipGroup
          options={TOPICS}
          selected={data.desks}
          onToggle={(value) => {
            update('desks', toggleValue(data.desks, value));
            touch('desks');
          }}
        />
      </Section>

      <ShortBioField data={data} update={update} placeholder="What kinds of stories are you looking to commission?" />
    </FormStep>
  );
}
