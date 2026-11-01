'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import InfoCard from '../InfoCard/InfoCard';
import Field from '../Field/Field';
import FormActions from './FormActions';
import type { BasicInfo } from '../../types/profile.types';
import styles from './Profile.module.css';

type BasicInfoFormProps = {
  basic: BasicInfo;
  onSave: (basic: BasicInfo) => void;
  onCancel: () => void;
};

type Errors = Partial<Record<keyof BasicInfo, string>>;

export default function BasicInfoForm({ basic, onSave, onCancel }: BasicInfoFormProps) {
  // a copy to type into; the real profile only changes on Save
  const [draft, setDraft] = useState(basic);
  const [errors, setErrors] = useState<Errors>({});

  // one change handler for every field, e.g. update('email')
  const update = (key: keyof BasicInfo) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser reloading the page
    const next: Errors = {};
    if (!draft.firstName.trim()) next.firstName = 'Add your first name.';
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) next.email = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      location: draft.location.trim(),
    });
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
        <Field label="Location">
          <input
            className={styles.input}
            value={draft.location}
            onChange={update('location')}
            placeholder="City, country"
          />
        </Field>
        <FormActions onCancel={onCancel} />
      </form>
    </InfoCard>
  );
}
