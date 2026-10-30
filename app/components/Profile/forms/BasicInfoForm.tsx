'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import InfoCard from '../../InfoCard/InfoCard';
import Field from '../../Field/Field';
import FormActions from './FormActions';
import type { BasicInfo, EditableBasicInfo } from '../../../types/profile.types';
import styles from '../Profile.module.css';

type BasicInfoFormProps = {
  basic: BasicInfo;
  onSave: (basic: EditableBasicInfo) => void;
  onCancel: () => void;
};

type Errors = Partial<Record<keyof EditableBasicInfo, string>>;

export default function BasicInfoForm({ basic, onSave, onCancel }: BasicInfoFormProps) {
  // a copy to type into; the real profile only changes on Save
  const [draft, setDraft] = useState<EditableBasicInfo>({
    firstName: basic.firstName,
    lastName: basic.lastName,
    location: basic.location,
    photoUrl: basic.photoUrl,
  });
  const [errors, setErrors] = useState<Errors>({});

  // one change handler for every field, e.g. update('location')
  const update = (key: keyof EditableBasicInfo) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault(); // stop the browser reloading the page
    const next: Errors = {};
    if (!draft.firstName.trim()) next.firstName = 'Add your first name.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSave({
      ...draft,
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
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
        <Field label="Location">
          <input
            className={styles.input}
            value={draft.location}
            onChange={update('location')}
            placeholder="City, country"
          />
        </Field>
        {/* the login email lives in Clerk, so it isn't edited here */}
        <p className={styles.hint}>Your email ({basic.email}) is your login and can be changed in account settings.</p>
        <FormActions onCancel={onCancel} />
      </form>
    </InfoCard>
  );
}
