'use client';

import { useState, type FormEvent } from 'react';
import InfoCard from '../../InfoCard/InfoCard';
import Field from '../../Field/Field';
import TagInput from '../../TagInput/TagInput';
import FormActions from './FormActions';
import AvailabilityCard from '../../Availability/AvailabilityCard';
import { ROLE_CONFIG } from '../config/roleConfig';
import { DEFAULT_ORGS } from '../../../onboarding/constants';
import type { RoleDetails, RoleValue } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type RoleFormProps = {
  details: RoleDetails;
  /** resolves true once the change is saved, so the panel knows whether to close the form */
  onSave: (details: RoleDetails) => Promise<unknown> | unknown;
  onCancel: () => void;
};

const asTags = (value: RoleValue | undefined): string[] =>
  Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];

const asText = (value: RoleValue | undefined): string =>
  Array.isArray(value) ? value.join(', ') : typeof value === 'number' ? String(value) : (value ?? '');

export default function RoleForm({ details, onSave, onCancel }: RoleFormProps) {
  const config = ROLE_CONFIG[details.role];
  const [facts, setFacts] = useState<Record<string, RoleValue>>(details.facts);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: RoleValue) => setFacts((current) => ({ ...current, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ ...details, facts });
    } finally {
      setSaving(false);
    }
  };

  // availability has its own controls, so it is left out of this free-text form
  const editable = config.fields.filter((field) => field.type !== 'readonly' && field.type !== 'availability');
  const editsAvailability = config.fields.some((field) => field.type === 'availability');

  return (
    <>
      <InfoCard title={`Edit ${config.label} details`} accent={config.accent}>
        <form className={styles.form} onSubmit={submit} noValidate>
          {editable.map((field) => (
            <Field key={field.key} label={field.label} group={field.type === 'chips'}>
              {field.type === 'chips' ? (
                <TagInput
                  tags={asTags(facts[field.key])}
                  onChange={(tags) => set(field.key, tags)}
                  suggestions={field.options}
                  ariaLabel={field.label}
                  placeholder={field.options ? 'Type to search, or add your own' : 'Type a value and press Enter'}
                />
              ) : field.type === 'org' ? (
                <select
                  className={styles.input}
                  value={asText(facts[field.key])}
                  onChange={(e) => set(field.key, e.target.value)}
                >
                  <option value="">Choose an organisation</option>
                  {DEFAULT_ORGS.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={styles.input}
                  type={field.type === 'number' ? 'number' : 'text'}
                  min={field.type === 'number' ? 0 : undefined}
                  value={asText(facts[field.key])}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              )}
            </Field>
          ))}
          <FormActions onCancel={onCancel} saving={saving} />
        </form>
      </InfoCard>

      {/* the hours for this role are edited here, next to the rest of the role, and nowhere else */}
      {editsAvailability && <AvailabilityCard role={details.role} />}
    </>
  );
}
