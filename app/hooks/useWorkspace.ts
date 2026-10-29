'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { OnboardingRole } from '../types/onboarding.types';

export const WORKSPACE_HOME: Record<OnboardingRole, string> = {
  editor: '/dashboard',
  freelancer: '/dashboard/assignments',
};

const FREELANCER_ROUTES = ['/dashboard/assignments', '/dashboard/availability', '/dashboard/profile'];

/** The URL is shared workspace state, including reloads and browser history. */
export function useWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const role: OnboardingRole = FREELANCER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))
    ? 'freelancer'
    : 'editor';

  const switchRole = (nextRole: OnboardingRole) => {
    if (nextRole !== role) router.push(WORKSPACE_HOME[nextRole]);
  };

  return { role, switchRole, pathname };
}
