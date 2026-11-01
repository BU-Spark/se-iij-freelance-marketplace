import { isCurrentPath } from './nav.utils';

describe('isCurrentPath', () => {
  const desk = { key: 'desk', label: 'Desk', href: '/dashboard', exact: true };
  const roster = { key: 'roster', label: 'Roster', href: '/dashboard/roster' };

  it('matches the exact page', () => {
    expect(isCurrentPath('/dashboard', desk)).toBe(true);
  });

  it('does not match child pages for exact items', () => {
    expect(isCurrentPath('/dashboard/roster', desk)).toBe(false);
  });

  it('matches child pages for normal items', () => {
    expect(isCurrentPath('/dashboard/roster/42', roster)).toBe(true);
  });

  it('does not match a page that only starts with the same letters', () => {
    expect(isCurrentPath('/dashboard/rosters', roster)).toBe(false);
  });
});
