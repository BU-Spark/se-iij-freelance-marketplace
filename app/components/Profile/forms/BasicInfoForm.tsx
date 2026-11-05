'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import InfoCard from '../../InfoCard/InfoCard';
import Field from '../../Field/Field';
import FormActions from './FormActions';
import { validateBasic, type BasicErrors } from '../../../utils/profile.utils';
import type { BasicInfo } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type BasicInfoFormProps = {
  basic: BasicInfo;
  /** resolves true once the change is saved, so the panel knows whether to close the form */
  onSave: (basic: BasicInfo) => Promise<unknown> | unknown;
  onCancel: () => void;
};

type TextField = 'firstName' | 'lastName' | 'email' | 'shortBio' | 'longBio';

export default function BasicInfoForm({ basic, onSave, onCancel }: BasicInfoFormProps) {
  // a copy to type into; the real profile only changes on Save
  const [draft, setDraft] = useState(basic);
  const [errors, setErrors] = useState<BasicErrors>({});
  const [saving, setSaving] = useState(false);

  // one change handler for every field, e.g. update('email')
  const update = (key: TextField) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault(); // stop the browser reloading the page
    const problems = validateBasic(draft);
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        ...draft,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        shortBio: draft.shortBio.trim(),
        longBio: draft.longBio.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <InfoCard title="Edit basic info">
      <form className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.row}>
          <Field label="First name" error={errors.firstName}>
            <input
              className={styles.input}
              value={draft.firstName}
              onChange={update('firstName')}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Last name">
            <input
              className={styles.input}
              value={draft.lastName}
              onChange={update('lastName')}
              autoComplete="family-name"
            />
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          <input
            className={styles.input}
            type="email"
            value={draft.email}
            onChange={update('email')}
            autoComplete="email"
          />
        </Field>
        <Field label="Short bio">
          <textarea className={styles.input} rows={2} value={draft.shortBio} onChange={update('shortBio')} />
        </Field>
        <Field label="Long bio">
          <textarea className={styles.input} rows={4} value={draft.longBio} onChange={update('longBio')} />
        </Field>
        <FormActions onCancel={onCancel} saving={saving} />
      </form>
    </InfoCard>
  );
}
