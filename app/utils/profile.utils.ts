import { Role } from '../types/user.types';
import type { NewEditor, NewFreelancer, NewUser, OnboardingRole, ProfileData } from '../types/onboarding.types';

const ROLE_FOR: Record<OnboardingRole, Role> = {
  editor: Role.EDITOR,
  // TODO: confirm with data design, there's no FREELANCER role yet
  freelancer: Role.USER,
};

const toUser = (role: OnboardingRole, d: ProfileData): NewUser => ({
  email: d.email.trim(),
  firstName: d.firstName.trim(),
  lastName: d.lastName.trim(),
  shortBio: d.shortBio.trim() || undefined,
  roles: [ROLE_FOR[role]],
});

export const toEditor = (d: ProfileData): NewEditor => ({
  user: toUser('editor', d),
  organizationId: d.organizationId || undefined,
  desks: d.desks,
  jobTitle: d.jobTitle.trim(),
  yearsAtDesk: d.yearsAtDesk,
  // TODO: onboarding doesn't collect pitch preferences yet
  pitchPreferences: {
    preferredPitchFormat: '',
    averageResponseTime: 0,
    interestedTopics: [],
    editorialPreferences: [],
    lookingFor: [],
  },
});

export const toFreelancer = (d: ProfileData): NewFreelancer => ({
  user: toUser('freelancer', d),
  location: d.location.trim() || undefined,
  reportingBeats: d.reportingBeats,
  workMediums: d.workMediums,
  tools: d.tools,
  portfolio: d.portfolio,
});

/** Builds the payload to send to the API on submit */
export const toProfile = (role: OnboardingRole, d: ProfileData) => (role === 'editor' ? toEditor(d) : toFreelancer(d));
