import type { ComponentType } from 'react';
import type { OnboardingRole } from '../../types/onboarding.types';
import { EditorIcon } from '../icons/EditorIcon';
import { FreelancerIcon } from '../icons/FreelancerIcon';

export type NavItem = { label: string; href: string; badge?: number };

export const NAV_ITEMS: Record<OnboardingRole, NavItem[]> = {
  editor: [
    { label: 'Desk', href: '/dashboard' },
    { label: 'Roster', href: '/dashboard/roster' },
    { label: 'Find talent', href: '/dashboard/talent' },
    { label: 'Pitches', href: '/dashboard/pitches', badge: 2 },
    { label: 'My availability', href: '/dashboard/desk-availability' },
  ],
  freelancer: [
    { label: 'Assignments', href: '/dashboard/assignments' },
    { label: 'My pitches', href: '/dashboard/freelancer/pitches' },
    { label: 'My availability', href: '/dashboard/availability' },
  ],
};

export const ROLE_OPTIONS: { id: OnboardingRole; label: string; Icon: ComponentType }[] = [
  { id: 'editor', label: 'Editor', Icon: EditorIcon },
  { id: 'freelancer', label: 'Freelancer', Icon: FreelancerIcon },
];
