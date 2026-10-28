'use client';

import { useState, type FormEvent } from 'react';
import InfoCard from '../../InfoCard/InfoCard';
import Field from '../../Field/Field';
import FormActions from './FormActions';
import { ROLE_CONFIG } from '../config/roleConfig';
import type { RoleDetails } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type RoleFormProps = {
  details: RoleDetails;
  onSave: (details: RoleDetails) => void;
  onCancel: () => void;
};

export default function RoleForm({ details, onSave, onCancel }: RoleFormProps) {
  const config = ROLE_CONFIG[details.role];
  const [bio, setBio] = useState(details.bio);
  const [facts, setFacts] = useState(details.facts);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...details, bio: bio.trim(), facts });
  };

  return (
    <InfoCard title={`Edit ${config.label} details`} accent={config.accent}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <Field label="Bio">
          <textarea className={styles.input} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>
        {/* the role config decides which fields this role has */}
        {config.facts.map((f) => (
          <Field key={f.key} label={f.label}>
            <input
              className={styles.input}
              value={facts[f.key] ?? ''}
              onChange={(e) => setFacts((current) => ({ ...current, [f.key]: e.target.value }))}
            />
          </Field>
        ))}
        <FormActions onCancel={onCancel} />
      </form>
    </InfoCard>
  );
}
