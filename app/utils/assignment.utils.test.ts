import { createSlug, EMPTY_ASSIGNMENT, hasErrors, makeSeed, slugify, validateAssignment } from './assignment.utils';

const validAssignment = {
  ...EMPTY_ASSIGNMENT,
  title: 'City council overnight vote',
  category: 'Reporting/Writing',
  slug: 'city-council-overnight',
  deadline: '2026-11-01T23:00',
};

describe('validateAssignment', () => {
  it('accepts a complete assignment', () => {
    expect(validateAssignment(validAssignment)).toEqual({});
    expect(hasErrors(validateAssignment(validAssignment))).toBe(false);
  });

  it('requires a title and project type', () => {
    const errors = validateAssignment(EMPTY_ASSIGNMENT);
    expect(errors.title).toBe('Give the assignment a title.');
    expect(errors.category).toBe('Pick a project type.');
  });

  it('requires a slug', () => {
    expect(validateAssignment({ ...validAssignment, slug: '  ' }).slug).toBe('Add a slug.');
  });

  it.each(['City-Council', 'city_council', 'city--council', 'city council'])('rejects the slug %p', (slug) => {
    expect(validateAssignment({ ...validAssignment, slug }).slug).toBe(
      'Use lowercase letters, numbers, and single hyphens.'
    );
  });

  it('rejects an unparseable deadline', () => {
    expect(validateAssignment({ ...validAssignment, deadline: 'tonight' }).deadline).toBe('Enter a valid deadline.');
  });

  it('allows an empty deadline', () => {
    expect(validateAssignment({ ...validAssignment, deadline: '' }).deadline).toBeUndefined();
  });
});

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('City Council Budget Vote')).toBe('city-council-budget-vote');
  });

  it('removes symbols and extra spaces', () => {
    expect(slugify('  Vote: Yes / No?!  ')).toBe('vote-yes-no');
  });

  it('removes accents', () => {
    expect(slugify('Café Owners Protest')).toBe('cafe-owners-protest');
  });

  it('keeps slugs short', () => {
    expect(slugify('a'.repeat(100)).length).toBeLessThanOrEqual(60);
  });
});

describe('makeSeed', () => {
  it('makes a short lowercase code', () => {
    expect(makeSeed()).toMatch(/^[a-z0-9]{6}$/);
  });

  it('is different each time', () => {
    expect(makeSeed()).not.toBe(makeSeed());
  });
});

describe('createSlug', () => {
  it('adds the seed to the end', () => {
    expect(createSlug('City Council Vote', 'abc123')).toBe('city-council-vote-abc123');
  });

  it('falls back when the title has no letters', () => {
    expect(createSlug('!!!', 'abc123')).toBe('assignment-abc123');
  });

  it('passes the existing slug validation', () => {
    expect(validateAssignment({ ...validAssignment, slug: createSlug('City Council Vote') }).slug).toBeUndefined();
  });
});
