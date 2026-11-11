import { DEFAULT_ORGS } from '../onboarding/constants';

/**
 * The display name for an organization id, e.g. "meridian" -> "The Meridian Post".
 * Organizations are a fixed list for now, so an unknown id falls back to the id itself.
 */
export function organizationName(id: string | null | undefined): string | null {
  if (!id) return null;
  return DEFAULT_ORGS.find((org) => org.id === id)?.name ?? id;
}
