import { EMPTY_ASSIGNMENT, hasErrors, validateAssignment } from './assignment.utils';

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
