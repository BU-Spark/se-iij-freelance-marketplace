/** The 50 US states plus DC, with their postal abbreviations */
export const US_STATES: { name: string; abbr: string }[] = [
  { name: 'Alabama', abbr: 'AL' },
  { name: 'Alaska', abbr: 'AK' },
  { name: 'Arizona', abbr: 'AZ' },
  { name: 'Arkansas', abbr: 'AR' },
  { name: 'California', abbr: 'CA' },
  { name: 'Colorado', abbr: 'CO' },
  { name: 'Connecticut', abbr: 'CT' },
  { name: 'Delaware', abbr: 'DE' },
  { name: 'District of Columbia', abbr: 'DC' },
  { name: 'Florida', abbr: 'FL' },
  { name: 'Georgia', abbr: 'GA' },
  { name: 'Hawaii', abbr: 'HI' },
  { name: 'Idaho', abbr: 'ID' },
  { name: 'Illinois', abbr: 'IL' },
  { name: 'Indiana', abbr: 'IN' },
  { name: 'Iowa', abbr: 'IA' },
  { name: 'Kansas', abbr: 'KS' },
  { name: 'Kentucky', abbr: 'KY' },
  { name: 'Louisiana', abbr: 'LA' },
  { name: 'Maine', abbr: 'ME' },
  { name: 'Maryland', abbr: 'MD' },
  { name: 'Massachusetts', abbr: 'MA' },
  { name: 'Michigan', abbr: 'MI' },
  { name: 'Minnesota', abbr: 'MN' },
  { name: 'Mississippi', abbr: 'MS' },
  { name: 'Missouri', abbr: 'MO' },
  { name: 'Montana', abbr: 'MT' },
  { name: 'Nebraska', abbr: 'NE' },
  { name: 'Nevada', abbr: 'NV' },
  { name: 'New Hampshire', abbr: 'NH' },
  { name: 'New Jersey', abbr: 'NJ' },
  { name: 'New Mexico', abbr: 'NM' },
  { name: 'New York', abbr: 'NY' },
  { name: 'North Carolina', abbr: 'NC' },
  { name: 'North Dakota', abbr: 'ND' },
  { name: 'Ohio', abbr: 'OH' },
  { name: 'Oklahoma', abbr: 'OK' },
  { name: 'Oregon', abbr: 'OR' },
  { name: 'Pennsylvania', abbr: 'PA' },
  { name: 'Rhode Island', abbr: 'RI' },
  { name: 'South Carolina', abbr: 'SC' },
  { name: 'South Dakota', abbr: 'SD' },
  { name: 'Tennessee', abbr: 'TN' },
  { name: 'Texas', abbr: 'TX' },
  { name: 'Utah', abbr: 'UT' },
  { name: 'Vermont', abbr: 'VT' },
  { name: 'Virginia', abbr: 'VA' },
  { name: 'Washington', abbr: 'WA' },
  { name: 'West Virginia', abbr: 'WV' },
  { name: 'Wisconsin', abbr: 'WI' },
  { name: 'Wyoming', abbr: 'WY' },
];

export const US_STATE_NAMES = US_STATES.map((state) => state.name);

const BY_ABBR = new Map(US_STATES.map((state) => [state.abbr, state.name]));

// longest first, so "West Virginia" wins over "Virginia" and "Arkansas" is never read as "Kansas"
const BY_LENGTH = [...US_STATES].sort((a, b) => b.name.length - a.name.length);

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The US state a free-text location is in, e.g. "Austin, TX" or "Portland, Oregon".
 * The abbreviation is checked first so "Washington, DC" and "Kansas City, MO" land in the right place.
 * A bare city like "Boston" has no state in it, so it returns undefined.
 */
export function usStateOf(location: string): string | undefined {
  const abbr = location.match(/,\s*([A-Z]{2})(?:\s|,|$)/)?.[1] ?? (/\bD\.C\./.test(location) ? 'DC' : undefined);
  const fromAbbr = abbr && BY_ABBR.get(abbr);
  if (fromAbbr) return fromAbbr;

  return BY_LENGTH.find((state) => new RegExp(`\\b${escape(state.name)}\\b`, 'i').test(location))?.name;
}

/** Whether a location matches a Location filter value, which is either a US state or an exact place */
export function matchesLocation(location: string, filter: string): boolean {
  if (!filter) return true;
  if (US_STATE_NAMES.includes(filter)) return usStateOf(location) === filter;
  return location === filter;
}
