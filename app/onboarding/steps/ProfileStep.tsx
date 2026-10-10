import PreviewCard from '../../components/PreviewCard';
import Section from '../../components/Section';
import Field from '../../components/Field';
import ChipGroup from '../../components/ChipGroup';
import OrgPicker from '../../components/OrgPicker';
import TagInput from '../../components/TagInput';
import shared from '../onboarding.module.css';
import styles from './ProfileStep.module.css';
import { AVAILABILITY, MEDIUMS, TOPICS } from '../constants';
import type { Organization, ProfileData, ProfileErrors, Role } from '../../types/onboarding.types';

export type Touched = Partial<Record<keyof ProfileData, boolean>>;
type TextKey = 'fullName' | 'email' | 'title' | 'experience' | 'location' | 'portfolio';
type ChipKey = 'desks' | 'beats' | 'mediums';

type ProfileStepProps = {
  role: Role;
  data: ProfileData;
  orgs: Organization[];
  errors: ProfileErrors;
  touched: Touched;
  shake: boolean;
  submitting: boolean;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  touch: (key: keyof ProfileData) => void;
  addOrg: (o: Organization) => void;
  onBack: () => void;
  onSubmit: () => void;
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
            <Field label="Full name" error={err('fullName')}>
              {input('fullName', 'Sarah Jenkins')}
            </Field>
            <Field label={isEditor ? 'Work email' : 'Email'} error={err('email')}>
              {input('email', isEditor ? 'you@newsroom.example' : 'you@example.com', 'email')}
            </Field>
            {isEditor ? (
              <>
                <Field label="Position / title" error={err('title')}>
                  {input('title', 'News Editor')}
                </Field>
                <Field label="Years at desk">{input('experience', '4 years at desk · 18 in journalism')}</Field>
              </>
            ) : (
              <>
                <Field label="Based in">{input('location', 'Boston, MA')}</Field>
                <Field label="Experience">{input('experience', '6 years freelancing')}</Field>
              </>
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
              <OrgPicker orgs={p.orgs} selected={data.orgId} onSelect={(id) => update('orgId', id)} onAdd={p.addOrg} />
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
            <Section title="Beats" hint="What do you cover?" color="var(--c-amber)" error={err('beats')}>
              {chips('beats', TOPICS)}
            </Section>
            <Section title="Mediums" hint="How do you tell stories?" color="var(--c-red)" error={err('mediums')}>
              {chips('mediums', MEDIUMS)}
            </Section>
            <Section title="Tools" hint="Type a tool and press Enter." color="var(--c-purple)">
              <TagInput tags={data.tools} onChange={(t) => update('tools', t)} />
            </Section>
            <Section title="Clips & availability" color="var(--c-sky)">
              <Field label="Portfolio link" error={err('portfolio')}>
                {input('portfolio', 'https://yourportfolio.com')}
              </Field>
              <div className={styles.availability}>
                {AVAILABILITY.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={styles.availBtn}
                    data-active={data.availability === a.value}
                    style={{ ['--accent' as string]: a.color }}
                    onClick={() => update('availability', a.value)}
                  >
                    <span className={styles.pulseDot} />
                    {a.label}
                  </button>
                ))}
              </div>
            </Section>
          </>
        )}

        <Section title="Short bio" color="var(--c-blue)">
          <Field label={`About you · ${data.bio.length}/280`}>
            <textarea
              rows={4}
              maxLength={280}
              value={data.bio}
              onChange={(e) => update('bio', e.target.value)}
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
      </section>

      <aside className={styles.previewCol}>
        <p className={styles.previewLabel}>Live preview</p>
        <PreviewCard role={role} data={data} org={p.orgs.find((o) => o.id === data.orgId)} />
      </aside>
    </div>
  );
}
