import { ChipGroup, Field, OrgPicker, PreviewCard, Section, TagInput } from '../../components';
import shared from '../onboarding.module.css';
import styles from './ProfileStep.module.css';
import { MEDIUMS, TOPICS } from '../constants';
import type { OnboardingRole, OrgOption, ProfileData, ProfileErrors } from '../../types/onboarding.types';

export type Touched = Partial<Record<keyof ProfileData, boolean>>;
type TextKey = 'firstName' | 'lastName' | 'email' | 'jobTitle' | 'location';
type ChipKey = 'desks' | 'reportingBeats' | 'workMediums';

type ProfileStepProps = {
  role: OnboardingRole;
  data: ProfileData;
  orgs: OrgOption[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  submitting: boolean;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  touch: (key: keyof ProfileData) => void;
  addOrg: (o: OrgOption) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitError: string | null;
};

export default function ProfileStep(p: ProfileStepProps) {
  const { role, data, errors, touched, update, touch } = p;
  const isEditor = role === 'editor';
  const err = (k: keyof ProfileData) => (touched[k] ? errors[k] : undefined);

  const input = (key: TextKey, placeholder: string, type = 'text') => (
    <input
      type={type}
      value={data[key]}
      placeholder={placeholder}
      onChange={(e) => update(key, e.target.value)}
      onBlur={() => touch(key)}
    />
  );

  const chips = (key: ChipKey, options: typeof TOPICS | typeof MEDIUMS) => (
    <ChipGroup
      options={options}
      selected={data[key]}
      onToggle={(v) => {
        const list = data[key];
        update(key, list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
        touch(key);
      }}
    />
  );

  return (
    <div className={`${styles.profileLayout} ${shared.fadeIn}`}>
      <section className={styles.formCol}>
        <button className={styles.back} onClick={p.onBack}>
          ← Change role
        </button>
        <p className={styles.roleTag} data-role={role}>
          {isEditor ? 'Editor' : 'Freelancer'}
        </p>
        <h1 className={shared.h1}>Build your profile</h1>
        <p className={shared.lead}>
          {isEditor
            ? "Freelancers see this when they're deciding whether to pitch you."
            : "Editors see this when they're deciding who to assign."}
        </p>

        <Section title="Basics" color="var(--c-green)">
          <div className={styles.grid2}>
            <Field label="First name" error={err('firstName')}>
              {input('firstName', 'Sarah')}
            </Field>
            <Field label="Last name" error={err('lastName')}>
              {input('lastName', 'Jenkins')}
            </Field>
            <Field label={isEditor ? 'Work email' : 'Email'} error={err('email')}>
              {input('email', isEditor ? 'you@newsroom.example' : 'you@example.com', 'email')}
            </Field>
            {isEditor ? (
              <>
                <Field label="Position / title" error={err('jobTitle')}>
                  {input('jobTitle', 'News Editor')}
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
              </>
            ) : (
              <Field label="Based in">{input('location', 'Boston, MA')}</Field>
            )}
          </div>
        </Section>

        {isEditor ? (
          <>
            <Section
              title="Organization"
              hint="Pick your newsroom, or add one that isn't listed."
              color="var(--c-amber)"
            >
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
              {chips('desks', TOPICS)}
            </Section>
          </>
        ) : (
          <>
            <Section title="Beats" hint="What do you cover?" color="var(--c-amber)" error={err('reportingBeats')}>
              {chips('reportingBeats', TOPICS)}
            </Section>
            <Section title="Mediums" hint="How do you tell stories?" color="var(--c-red)" error={err('workMediums')}>
              {chips('workMediums', MEDIUMS)}
            </Section>
            <Section title="Tools" hint="Type a tool and press Enter." color="var(--c-purple)">
              <TagInput tags={data.tools} onChange={(t) => update('tools', t)} />
            </Section>
            <Section title="Clips" color="var(--c-sky)">
              <Field label="Portfolio link" error={err('portfolio')}>
                <input
                  value={data.portfolio[0]?.url ?? ''}
                  placeholder="https://yourportfolio.com"
                  onChange={(e) => {
                    const url = e.target.value;
                    update(
                      'portfolio',
                      url ? [{ id: 'portfolio-link', type: 'article', title: 'Portfolio', url }] : []
                    );
                  }}
                  onBlur={() => touch('portfolio')}
                />
              </Field>
            </Section>
          </>
        )}

        <Section title="Short bio" color="var(--c-blue)">
          <Field label={`About you · ${data.shortBio.length}/280`}>
            <textarea
              rows={4}
              maxLength={280}
              value={data.shortBio}
              onChange={(e) => update('shortBio', e.target.value)}
              placeholder={
                isEditor
                  ? 'What kinds of stories are you looking to commission?'
                  : 'What makes your reporting stand out?'
              }
            />
          </Field>
        </Section>

        <div className={`${shared.actions} ${p.shake ? styles.shake : ''}`}>
          <button className={shared.secondaryBtn} onClick={p.onBack}>
            Back
          </button>
          <button className={shared.primaryBtn} onClick={p.onSubmit} disabled={p.submitting}>
            {p.submitting ? <span className={styles.spinner} /> : 'Create profile →'}
          </button>
        </div>
        {p.submitError && <p role="alert">{p.submitError}</p>}
      </section>

      <aside className={styles.previewCol}>
        <p className={styles.previewLabel}>Live preview</p>
        <PreviewCard role={role} data={data} org={p.orgs.find((o) => o.id === data.organizationId)} />
      </aside>
    </div>
  );
}
