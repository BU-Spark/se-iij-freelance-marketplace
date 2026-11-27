'use client';

import { FormEvent, useState } from 'react';
import { Field, TagInput } from '../../../components';
import { REACH_DETAIL, REACH_LABEL, type OrgReach } from '../../../dashboard/freelancer/organizations/constants';
import { EMPTY_DETAILS, ORG_BEATS, type OrgDetails } from '../orgSignup';
import { validateOrgDetails, type OrgDetailsErrors } from '../orgSignup.validation';
import OrgPagePreview from '../OrgPagePreview';
import OrgSignupDone from '../OrgSignupDone';
import OrgSignupShell from '../OrgSignupShell';
import auth from '../../../login/login.module.css';
import styles from '../organizationSignup.module.css';

const REACHES = Object.keys(REACH_LABEL) as OrgReach[];

/** Step 2: the newsroom writes the page freelancers will read about it */
export default function OrgDetailsForm() {
  const [data, setData] = useState<OrgDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<OrgDetailsErrors>({});
  const [done, setDone] = useState(false);

  /** Typing in a field clears its error; it is checked again on the next submit */
  const update = <K extends keyof OrgDetails>(key: K, value: OrgDetails[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  /** Props shared by every plain text input */
  const bind = (key: Exclude<keyof OrgDetails, 'beats' | 'reach'>) => ({
    name: key,
    value: data[key],
    'aria-invalid': !!errors[key],
    onChange: (event: { target: { value: string } }) => update(key, event.target.value),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const found = validateOrgDetails(data);
    setErrors(found);

    if (Object.keys(found).length === 0) {
      setDone(true);
      window.scrollTo({ top: 0 });
      return;
    }

    // take the person to the first problem; the beats box has no named input to focus
    const first = Object.keys(found).find((key) => key !== 'beats');
    if (first) (event.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
  };

  if (done) {
    return (
      <OrgSignupShell eyebrow="All done" title="Your page is ready">
        <OrgSignupDone data={data} onEdit={() => setDone(false)} />
      </OrgSignupShell>
    );
  }

  return (
    <OrgSignupShell
      eyebrow="Step 2 of 2"
      title="Create your organization page"
      intro="Tell freelancers who you are, what you cover and how to work with you."
    >
      <form className={auth.form} onSubmit={submit} noValidate>
        <fieldset className={styles.section}>
          <legend className={styles.legend}>Your newsroom</legend>
          <Field label="Organization name" error={errors.name}>
            <input type="text" autoComplete="organization" placeholder="The Meridian Post" {...bind('name')} />
          </Field>
          <div className={styles.row}>
            <Field label="Website" error={errors.website}>
              <input type="url" autoComplete="url" placeholder="meridianpost.com" {...bind('website')} />
            </Field>
            <Field label="City" error={errors.city}>
              <input type="text" placeholder="New York, or Remote" {...bind('city')} />
            </Field>
          </div>

          <fieldset className={styles.reach}>
            <legend>Who can pitch you</legend>
            {REACHES.map((reach) => (
              <label key={reach} className={styles.option}>
                <input
                  type="radio"
                  name="reach"
                  value={reach}
                  checked={data.reach === reach}
                  onChange={() => update('reach', reach)}
                />
                <span>{REACH_DETAIL[reach]}</span>
              </label>
            ))}
          </fieldset>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>What freelancers see</legend>
          <Field label="Tagline" error={errors.tagline}>
            <input type="text" placeholder="One line on what you publish" {...bind('tagline')} />
          </Field>
          <Field label="About" error={errors.bio}>
            <textarea rows={4} placeholder="Your coverage, your readers and what editors look for" {...bind('bio')} />
          </Field>
          <Field label="Beats" error={errors.beats} group>
            <TagInput
              ariaLabel="Beats"
              placeholder="Type to search beats"
              tags={data.beats}
              onChange={(beats) => update('beats', beats)}
              suggestions={ORG_BEATS}
              allowCustom={false}
            />
          </Field>
          <Field label="Typical rate (optional)">
            <input type="text" placeholder="$1.00 / word" {...bind('rate')} />
          </Field>
        </fieldset>

        <OrgPagePreview data={data} />

        {Object.values(errors).some(Boolean) && (
          <p role="alert" className={styles.formError}>
            Check the highlighted fields.
          </p>
        )}

        <button type="submit" className={auth.submit}>
          Create organization page <span aria-hidden="true">→</span>
        </button>
      </form>
    </OrgSignupShell>
  );
}
