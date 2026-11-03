'use client';

import { useState, type FormEvent } from 'react';
import InfoCard from '../../InfoCard/InfoCard';
import Field from '../../Field/Field';
import TagInput from '../../TagInput/TagInput';
import FormActions from './FormActions';
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

  const set = (key: string, value: RoleValue) => setFacts((current) => ({ ...current, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onSave({ ...details, facts });
  };

  // availability is shown on the card but only onboarding can change it
  const editable = config.fields.filter((field) => field.type !== 'readonly');

  return (
    <InfoCard title={`Edit ${config.label} details`} accent={config.accent}>
      <form className={styles.form} onSubmit={submit} noValidate>
        {editable.map((field) => (
          <Field key={field.key} label={field.label}>
            {field.type === 'chips' ? (
              <TagInput
                tags={asTags(facts[field.key])}
                onChange={(tags) => set(field.key, tags)}
                placeholder="Type a value and press Enter"
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
        <FormActions onCancel={onCancel} />
      </form>
    </InfoCard>
  );
}
