'use client';

import { useMemo, useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import IIJLogo from '../components/IIJLogo';
import styles from './onboarding.module.css';
import type { Availability, Organization, ProfileData, ProfileErrors, Role } from '../types/onboarding.types';

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const DEFAULT_ORGS: Organization[] = [
  { id: 'meridian', name: 'The Meridian Post', city: 'New York' },
  { id: 'crosswind', name: 'Crosswind Weekly', city: 'Berlin' },
  { id: 'signal', name: 'Signal Room', city: 'Remote' },
  { id: 'broadsheet', name: 'Broadsheet Pacific', city: 'Tokyo' },
];

const TOPICS = [
  'Politics',
  'Business',
  'Climate',
  'Tech',
  'Culture',
  'Health',
  'Local',
  'World',
  'Sports',
  'Investigations',
];

const MEDIUMS = ['Text', 'Photo', 'Video', 'Audio', 'Data', 'Illustration'];

// Each chip gets a logo color, cycling through the fan
const CHIP_COLORS = [
  'var(--c-green)',
  'var(--c-amber)',
  'var(--c-red)',
  'var(--c-purple)',
  'var(--c-sky)',
  'var(--c-blue)',
  'var(--c-yellow)',
  'var(--c-pink)',
  'var(--c-green-d)',
  'var(--c-orange)',
];

const AVAILABILITY: { value: Availability; label: string; color: string }[] = [
  { value: 'available', label: 'Available today', color: 'var(--c-green)' },
  { value: 'this-week', label: 'Later this week', color: 'var(--c-amber)' },
  { value: 'booked', label: 'Fully booked', color: 'var(--c-red)' },
];

const EMPTY: ProfileData = {
  fullName: '',
  email: '',
  bio: '',
  title: '',
  experience: '',
  orgId: 'meridian',
  desks: [],
  location: '',
  beats: [],
  mediums: [],
  tools: [],
  portfolio: '',
  availability: 'available',
};

type Step = 'role' | 'profile' | 'done';

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

function validate(role: Role, d: ProfileData): ProfileErrors {
  const e: ProfileErrors = {};
  if (d.fullName.trim().length < 2) e.fullName = 'Please enter your full name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Enter a valid email address';

  if (role === 'editor') {
    if (!d.title.trim()) e.title = "What's your position?";
    if (d.desks.length === 0) e.desks = 'Pick at least one desk';
  } else {
    if (d.beats.length === 0) e.beats = 'Pick at least one beat';
    if (d.mediums.length === 0) e.mediums = 'Pick at least one medium';
    if (d.portfolio && !/^https?:\/\/\S+\.\S+/.test(d.portfolio))
      e.portfolio = 'Link should start with http:// or https://';
  }
  return e;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [data, setData] = useState<ProfileData>(EMPTY);
  const [orgs, setOrgs] = useState<Organization[]>(DEFAULT_ORGS);
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileData, boolean>>>({});
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => (role ? validate(role, data) : {}), [role, data]);

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const touch = (key: keyof ProfileData) => setTouched((t) => ({ ...t, [key]: true }));

  const pickRole = (r: Role) => {
    setRole(r);
    setTouched({});
    setStep('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const all = Object.keys(errors).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched((t) => ({ ...t, ...all }));

    if (Object.keys(errors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setSubmitting(true);
    // TODO: replace with your real API call, e.g. await fetch("/api/profile", {...})
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const progress = step === 'role' ? 33 : step === 'profile' ? 66 : 100;
  const stepLabel =
    step === 'role' ? 'Step 1 of 2 — Who are you?' : step === 'profile' ? 'Step 2 of 2 — Your profile' : 'All done';

  return (
    <div className={styles.shell}>
      {/* ---------------- Header ---------------- */}
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <IIJLogo size={40} showText={false} animated={false} />
          <span>
            <strong>IIJ</strong>
            <small>Institute for Independent Journalists</small>
          </span>
        </Link>
        <span className={styles.stepLabel}>{stepLabel}</span>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className={styles.main}>
        {step === 'role' && <RoleStep onPick={pickRole} />}

        {step === 'profile' && role && (
          <ProfileStep
            role={role}
            data={data}
            orgs={orgs}
            errors={errors}
            touched={touched}
            shake={shake}
            submitting={submitting}
            update={update}
            touch={touch}
            addOrg={(o) => {
              setOrgs((list) => [...list, o]);
              update('orgId', o.id);
            }}
            onBack={() => setStep('role')}
            onSubmit={handleSubmit}
          />
        )}

        {step === 'done' && role && (
          <DoneStep
            role={role}
            data={data}
            org={orgs.find((o) => o.id === data.orgId)}
            onEdit={() => setStep('profile')}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Role picker                                               */
/* ------------------------------------------------------------------ */

function RoleStep({ onPick }: { onPick: (r: Role) => void }) {
  return (
    <section className={`${styles.narrow} ${styles.fadeIn}`}>
      <h1 className={styles.h1}>Welcome aboard</h1>
      <p className={styles.lead}>
        The assignment desk that connects newsroom editors with the independent journalists who can take the work. Tell
        us which side you&apos;re on and we&apos;ll build your profile.
      </p>

      <div className={styles.roleGrid}>
        <button
          className={styles.roleCard}
          style={{ ['--accent' as string]: 'var(--c-blue)' }}
          onClick={() => onPick('editor')}
        >
          <span className={styles.roleIcon}>
            <EditorIcon />
          </span>
          <h2>I&apos;m an editor</h2>
          <p>
            Post assignments, see who&apos;s available today, review pitches, and assign the freelancers who signal
            interest.
          </p>
          <span className={styles.roleLink}>
            Set up editor profile <span className={styles.arrow}>→</span>
          </span>
        </button>

        <button
          className={styles.roleCard}
          style={{ ['--accent' as string]: 'var(--c-purple)' }}
          onClick={() => onPick('freelancer')}
        >
          <span className={styles.roleIcon}>
            <FreelancerIcon />
          </span>
          <h2>I&apos;m a freelancer</h2>
          <p>
            Publish your beats, mediums, tools and clips, keep your availability current, and pitch stories to editors.
          </p>
          <span className={styles.roleLink}>
            Set up freelancer profile <span className={styles.arrow}>→</span>
          </span>
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Profile form + live preview                               */
/* ------------------------------------------------------------------ */

type ProfileStepProps = {
  role: Role;
  data: ProfileData;
  orgs: Organization[];
  errors: ProfileErrors;
  touched: Partial<Record<keyof ProfileData, boolean>>;
  shake: boolean;
  submitting: boolean;
  update: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  touch: (key: keyof ProfileData) => void;
  addOrg: (o: Organization) => void;
  onBack: () => void;
  onSubmit: () => void;
};

function ProfileStep(p: ProfileStepProps) {
  const { role, data, errors, touched, update, touch } = p;
  const isEditor = role === 'editor';
  const err = (k: keyof ProfileData) => (touched[k] ? errors[k] : undefined);

  const toggle = (key: 'desks' | 'beats' | 'mediums', value: string) => {
    const list = data[key];
    update(key, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
    touch(key);
  };

  return (
    <div className={`${styles.profileLayout} ${styles.fadeIn}`}>
      <section className={styles.formCol}>
        <button className={styles.back} onClick={p.onBack}>
          ← Change role
        </button>
        <p className={styles.roleTag} data-role={role}>
          {isEditor ? 'Editor' : 'Freelancer'}
        </p>
        <h1 className={styles.h1}>Build your profile</h1>
        <p className={styles.lead}>
          {isEditor
            ? "Freelancers see this when they're deciding whether to pitch you."
            : "Editors see this when they're deciding who to assign."}
        </p>

        {/* ---------- Basics ---------- */}
        <Section title="Basics" color="var(--c-green)">
          <div className={styles.grid2}>
            <Field label="Full name" error={err('fullName')}>
              <input
                value={data.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                onBlur={() => touch('fullName')}
                placeholder="Sarah Jenkins"
              />
            </Field>
            <Field label={isEditor ? 'Work email' : 'Email'} error={err('email')}>
              <input
                type="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
                onBlur={() => touch('email')}
                placeholder={isEditor ? 'you@newsroom.example' : 'you@example.com'}
              />
            </Field>

            {isEditor ? (
              <>
                <Field label="Position / title" error={err('title')}>
                  <input
                    value={data.title}
                    onChange={(e) => update('title', e.target.value)}
                    onBlur={() => touch('title')}
                    placeholder="News Editor"
                  />
                </Field>
                <Field label="Years at desk">
                  <input
                    value={data.experience}
                    onChange={(e) => update('experience', e.target.value)}
                    placeholder="4 years at desk · 18 in journalism"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Based in">
                  <input
                    value={data.location}
                    onChange={(e) => update('location', e.target.value)}
                    placeholder="Boston, MA"
                  />
                </Field>
                <Field label="Experience">
                  <input
                    value={data.experience}
                    onChange={(e) => update('experience', e.target.value)}
                    placeholder="6 years freelancing"
                  />
                </Field>
              </>
            )}
          </div>
        </Section>

        {/* ---------- Editor: organization + desks ---------- */}
        {isEditor && (
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
              <ChipGroup options={TOPICS} selected={data.desks} onToggle={(v) => toggle('desks', v)} />
            </Section>
          </>
        )}

        {/* ---------- Freelancer: beats, mediums, tools, availability ---------- */}
        {!isEditor && (
          <>
            <Section title="Beats" hint="What do you cover?" color="var(--c-amber)" error={err('beats')}>
              <ChipGroup options={TOPICS} selected={data.beats} onToggle={(v) => toggle('beats', v)} />
            </Section>

            <Section title="Mediums" hint="How do you tell stories?" color="var(--c-red)" error={err('mediums')}>
              <ChipGroup options={MEDIUMS} selected={data.mediums} onToggle={(v) => toggle('mediums', v)} />
            </Section>

            <Section title="Tools" hint="Type a tool and press Enter." color="var(--c-purple)">
              <TagInput tags={data.tools} onChange={(t) => update('tools', t)} />
            </Section>

            <Section title="Clips & availability" color="var(--c-sky)">
              <Field label="Portfolio link" error={err('portfolio')}>
                <input
                  value={data.portfolio}
                  onChange={(e) => update('portfolio', e.target.value)}
                  onBlur={() => touch('portfolio')}
                  placeholder="https://yourportfolio.com"
                />
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

        {/* ---------- Bio ---------- */}
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

        <div className={`${styles.actions} ${p.shake ? styles.shake : ''}`}>
          <button className={styles.secondaryBtn} onClick={p.onBack}>
            Back
          </button>
          <button className={styles.primaryBtn} onClick={p.onSubmit} disabled={p.submitting}>
            {p.submitting ? <span className={styles.spinner} /> : 'Create profile →'}
          </button>
        </div>
      </section>

      {/* ---------- Live preview ---------- */}
      <aside className={styles.previewCol}>
        <p className={styles.previewLabel}>Live preview</p>
        <PreviewCard role={role} data={data} org={p.orgs.find((o) => o.id === data.orgId)} />
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Success                                                   */
/* ------------------------------------------------------------------ */

function DoneStep({
  role,
  data,
  org,
  onEdit,
}: {
  role: Role;
  data: ProfileData;
  org?: Organization;
  onEdit: () => void;
}) {
  return (
    <section className={`${styles.narrow} ${styles.done}`}>
      <div className={styles.confetti} aria-hidden="true">
        {CHIP_COLORS.concat(CHIP_COLORS).map((c, i) => (
          <span
            key={i}
            style={{
              background: c,
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 7) * 90}ms`,
            }}
          />
        ))}
      </div>

      <div className={styles.checkRing}>
        <svg viewBox="0 0 52 52" width="56" height="56">
          <path
            d="M14 27 l8 8 l16 -18"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className={styles.h1}>You&apos;re all set, {data.fullName.split(' ')[0]}!</h1>
      <p className={styles.lead}>
        {role === 'editor'
          ? 'Your editor profile is live. Freelancers can now find you and start pitching.'
          : 'Your freelancer profile is live. Editors can now see your beats and availability.'}
      </p>

      <div className={styles.doneCard}>
        <PreviewCard role={role} data={data} org={org} />
      </div>

      <div className={styles.actions} style={{ justifyContent: 'center' }}>
        <button className={styles.secondaryBtn} onClick={onEdit}>
          Edit profile
        </button>
        <Link href="/" className={styles.primaryBtn}>
          {role === 'editor' ? 'Post first assignment →' : 'Browse assignments →'}
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function Section({
  title,
  hint,
  color,
  error,
  children,
}: {
  title: string;
  hint?: string;
  color: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} style={{ ['--accent' as string]: color }}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className={styles.field} data-error={!!error}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className={styles.chips}>
      {options.map((o, i) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            className={styles.chip}
            data-active={active}
            aria-pressed={active}
            style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}
            onClick={() => onToggle(o)}
          >
            <span className={styles.chipMark}>{active ? '✓' : '+'}</span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

function OrgPicker({
  orgs,
  selected,
  onSelect,
  onAdd,
}: {
  orgs: Organization[];
  selected: string;
  onSelect: (id: string) => void;
  onAdd: (o: Organization) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const save = () => {
    if (!name.trim()) return;
    onAdd({ id: `org-${Date.now()}`, name: name.trim(), city: city.trim() || '—' });
    setName('');
    setCity('');
    setAdding(false);
  };

  return (
    <div className={styles.orgGrid}>
      {orgs.map((o) => (
        <button
          key={o.id}
          type="button"
          className={styles.orgCard}
          data-active={selected === o.id}
          onClick={() => onSelect(o.id)}
        >
          <strong>{o.name}</strong>
          <span>{o.city}</span>
        </button>
      ))}

      {adding ? (
        <div className={`${styles.orgAdd} ${styles.fadeIn}`}>
          <input autoFocus placeholder="Newsroom name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <div className={styles.orgAddActions}>
            <button type="button" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button type="button" className={styles.miniPrimary} onClick={save}>
              Add
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={styles.orgNew} onClick={() => setAdding(true)}>
          <span>＋</span> Add new organization
        </button>
      )}
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [value, setValue] = useState('');

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && value.trim()) {
      e.preventDefault();
      if (!tags.includes(value.trim())) onChange([...tags, value.trim()]);
      setValue('');
    } else if (e.key === 'Backspace' && !value && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className={styles.tagInput}>
      {tags.map((t, i) => (
        <span key={t} className={styles.tag} style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}>
          {t}
          <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}>
            ×
          </button>
        </span>
      ))}
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder={tags.length ? '' : 'Premiere Pro, Datawrapper, Lightroom…'}
      />
    </div>
  );
}

function PreviewCard({ role, data, org }: { role: Role; data: ProfileData; org?: Organization }) {
  const initials =
    data.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?';

  const tags = role === 'editor' ? data.desks : [...data.beats, ...data.mediums];
  const avail = AVAILABILITY.find((a) => a.value === data.availability)!;

  return (
    <div className={styles.preview}>
      <div className={styles.previewBanner} />
      <div className={styles.avatar}>{initials}</div>
      <h4>{data.fullName || 'Your name'}</h4>
      <p className={styles.previewMeta}>
        {role === 'editor'
          ? `${data.title || 'Your title'} · ${org?.name ?? 'Your newsroom'}`
          : `Freelancer${data.location ? ` · ${data.location}` : ''}`}
      </p>

      {role === 'freelancer' && (
        <span className={styles.previewAvail} style={{ ['--accent' as string]: avail.color }}>
          <span className={styles.pulseDot} /> {avail.label}
        </span>
      )}

      {data.bio && <p className={styles.previewBio}>{data.bio}</p>}

      <div className={styles.previewTags}>
        {tags.length ? (
          tags.map((t, i) => (
            <span key={t} style={{ ['--accent' as string]: CHIP_COLORS[i % CHIP_COLORS.length] }}>
              {t}
            </span>
          ))
        ) : (
          <em>{role === 'editor' ? 'Desks appear here' : 'Beats & mediums appear here'}</em>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function EditorIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21v-1a6 6 0 0 1 9.5-4.9" />
      <circle cx="18" cy="17" r="2.5" />
      <path d="M18 13v1.5M18 19.5V21M14 17h1.5M20.5 17H22" />
    </svg>
  );
}

function FreelancerIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}
