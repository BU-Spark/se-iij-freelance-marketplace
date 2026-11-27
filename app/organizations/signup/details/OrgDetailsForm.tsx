'use client';

import { FormEvent, useState } from 'react';
import { Field, TagInput } from '../../../components';
import { REACH_DETAIL, REACH_LABEL, type OrgReach } from '../../../dashboard/freelancer/organizations/constants';
import { EMPTY_DETAILS, ORG_BEATS, type OrgDetails } from '../orgSignup';
import OrgSignupShell from '../OrgSignupShell';

const REACHES = Object.keys(REACH_LABEL) as OrgReach[];

/** Step 2: the newsroom writes the page freelancers will read about it */
export default function OrgDetailsForm() {
  const [data, setData] = useState<OrgDetails>(EMPTY_DETAILS);
  const update = <K extends keyof OrgDetails>(key: K, value: OrgDetails[K]) =>
    setData((current) => ({ ...current, [key]: value }));

  /** Props shared by every plain text input */
  const bind = (key: Exclude<keyof OrgDetails, 'beats' | 'reach'>) => ({
    name: key,
    value: data[key],
    onChange: (event: { target: { value: string } }) => update(key, event.target.value),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <OrgSignupShell
      eyebrow="Step 2 of 2"
      title="Create your organization page"
      intro="Tell freelancers who you are, what you cover and how to work with you."
    >
      <form onSubmit={submit} noValidate>
        <fieldset>
          <legend>Your newsroom</legend>
          <Field label="Organization name">
            <input type="text" autoComplete="organization" placeholder="The Meridian Post" {...bind('name')} />
          </Field>
          <Field label="Website">
            <input type="url" autoComplete="url" placeholder="meridianpost.com" {...bind('website')} />
          </Field>
          <Field label="City">
            <input type="text" placeholder="New York, or Remote" {...bind('city')} />
          </Field>

          <fieldset>
            <legend>Who can pitch you</legend>
            {REACHES.map((reach) => (
              <label key={reach}>
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

        <fieldset>
          <legend>What freelancers see</legend>
          <Field label="Tagline">
            <input type="text" placeholder="One line on what you publish" {...bind('tagline')} />
          </Field>
          <Field label="About">
            <textarea rows={4} placeholder="Your coverage, your readers and what editors look for" {...bind('bio')} />
          </Field>
          <Field label="Beats" group>
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

        <button type="submit">
          Create organization page <span aria-hidden="true">→</span>
        </button>
      </form>
    </OrgSignupShell>
  );
}
