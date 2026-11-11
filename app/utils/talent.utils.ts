import type { TalentFilters } from '../types/talent.types';

export const TALENT_PAGE_SIZE = 60;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

export function talentFiltersFrom(params: SearchParams): TalentFilters {
  return {
    q: first(params.q),
    beat: first(params.beat),
    medium: first(params.medium),
    location: first(params.location),
    availableNow: first(params.available) === '1',
  };
}

export function talentQueryString(filters: TalentFilters): string {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.beat) params.set('beat', filters.beat);
  if (filters.medium) params.set('medium', filters.medium);
  if (filters.location) params.set('location', filters.location);
  if (filters.availableNow) params.set('available', '1');
  const query = params.toString();
  return query ? `?${query}` : '';
}
