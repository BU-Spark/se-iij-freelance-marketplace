'use client';

import { useState, type FormEvent } from 'react';
import { DEFAULT_ORGS } from '../onboarding/constants';
import type { OrgOption } from '../types/onboarding.types';
import { BasicsSection } from './components/BasicsSection';
import { BioSection } from './components/BioSection';
import { DesksSection } from './components/DesksSection';
import { OrganizationSection } from './components/OrganizationSection';
import { PitchPreferencesSection } from './components/PitchPreferencesSection';
import { ProfileIntro } from './components/ProfileIntro';
import type { EditorProfileDraft } from './profile.types';
import styles from './profile.module.css';

const EMPTY_PROFILE: EditorProfileDraft = {
  fullName: '',
  email: '',
  position: '',
  yearsAtDesk: '',
  organizationId: 'meridian',
  desks: [],
  shortBio: '',
  fullBio: '',
  preferredPitchFormat: '',
  averageResponseTime: '',
  lookingFor: [],
  editorialPreferences: [],
  interestedTopics: [],
};

export function ProfileForm() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [organizations, setOrganizations] = useState<OrgOption[]>(DEFAULT_ORGS);

  const update = <K extends keyof EditorProfileDraft>(key: K, value: EditorProfileDraft[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const addOrganization = (organization: OrgOption) => {
    setOrganizations((current) => [...current, organization]);
    update('organizationId', organization.id);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <form className={styles.content} onSubmit={submit}>
      <ProfileIntro />
      <BasicsSection values={profile} onChange={update} />
      <OrganizationSection
        organizations={organizations}
        selected={profile.organizationId}
        onSelect={(id) => update('organizationId', id)}
        onAdd={addOrganization}
      />
      <DesksSection selected={profile.desks} onChange={(desks) => update('desks', desks)} />
      <BioSection shortBio={profile.shortBio} fullBio={profile.fullBio} onChange={update} />
      <PitchPreferencesSection values={profile} onTextChange={update} onTagsChange={update} />
      <div className={styles.actions}>
        <button type="submit" className={styles.submit}>
          Finish and open my desk →
        </button>
      </div>
    </form>
  );
}
