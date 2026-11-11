import { US_STATES, matchesLocation, usStateOf } from './location.utils';

describe('usStateOf', () => {
  it('lists all 50 states plus DC', () => {
    expect(US_STATES).toHaveLength(51);
  });

  it.each([
    ['Austin, TX', 'Texas'],
    ['Portland, Oregon', 'Oregon'],
    ['Charleston, West Virginia', 'West Virginia'],
    ['Richmond, Virginia', 'Virginia'],
    ['Little Rock, Arkansas', 'Arkansas'],
    ['Kansas City, MO', 'Missouri'],
    ['Washington, DC', 'District of Columbia'],
    ['Washington, D.C.', 'District of Columbia'],
    ['Seattle, Washington', 'Washington'],
    ['New York', 'New York'],
    ['Boston, MA, USA', 'Massachusetts'],
  ])('reads %s as %s', (location, state) => {
    expect(usStateOf(location)).toBe(state);
  });

  it.each(['Boston', 'Leeds, UK', 'Dakar', 'Tokyo', ''])('finds no state in %p', (location) => {
    expect(usStateOf(location)).toBeUndefined();
  });
});

describe('matchesLocation', () => {
  it('matches a state by the place inside it, and other places exactly', () => {
    expect(matchesLocation('Austin, TX', 'Texas')).toBe(true);
    expect(matchesLocation('Austin, TX', 'Oregon')).toBe(false);
    expect(matchesLocation('Dakar', 'Dakar')).toBe(true);
    expect(matchesLocation('Dakar', '')).toBe(true);
  });
});
