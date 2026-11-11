import { talentFiltersFrom, talentQueryString } from './talent.utils';

describe('talentFiltersFrom', () => {
  it('reads each filter from the URL, trimming text and taking the first of repeats', () => {
    expect(
      talentFiltersFrom({
        q: '  housing ',
        beat: ['Politics', 'Health'],
        medium: 'Audio',
        location: 'Leeds, UK',
        available: '1',
      })
    ).toEqual({ q: 'housing', beat: 'Politics', medium: 'Audio', location: 'Leeds, UK', availableNow: true });
  });

  it('treats missing or odd values as no filter', () => {
    expect(talentFiltersFrom({ available: 'yes' })).toEqual({
      q: '',
      beat: '',
      medium: '',
      location: '',
      availableNow: false,
    });
  });
});

describe('talentQueryString', () => {
  it('leaves empty filters out of the URL', () => {
    expect(talentQueryString({})).toBe('');
    expect(talentQueryString({ q: '  ', beat: '' })).toBe('');
    expect(talentQueryString({ q: 'city hall', availableNow: true })).toBe('?q=city+hall&available=1');
  });

  it('round-trips through talentFiltersFrom', () => {
    const filters = { q: 'housing', beat: 'Politics', medium: 'Audio', location: 'Leeds, UK', availableNow: true };
    const params = Object.fromEntries(new URLSearchParams(talentQueryString(filters)));
    expect(talentFiltersFrom(params)).toEqual(filters);
  });
});
