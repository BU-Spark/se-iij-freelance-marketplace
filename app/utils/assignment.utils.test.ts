import {
  assignmentToDraft,
  combineLengthAndTime,
  cleanAmount,
  createSlug,
  EMPTY_ASSIGNMENT,
  formatCompensation,
  hasErrors,
  makeSeed,
  slugify,
  splitLengthAndTime,
  toDateTimeLocal,
  validateAssignment,
  validateCompensation,
} from './assignment.utils';

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

describe('cleanAmount', () => {
  it('keeps only digits and one dot', () => {
    expect(cleanAmount('$1,2a50')).toBe('1250');
  });

  it('allows at most 2 decimals', () => {
    expect(cleanAmount('12.345')).toBe('12.34');
  });

  it('keeps only the first dot', () => {
    expect(cleanAmount('1.2.3')).toBe('1.23');
  });
});

describe('validateCompensation', () => {
  it.each(['', '0', '0.00', '.'])('rejects %p', (value) => {
    expect(validateCompensation(value)).toBe('Enter an amount greater than $0.');
  });

  it('accepts a positive amount', () => {
    expect(validateCompensation('750')).toBeUndefined();
  });
});

describe('formatCompensation', () => {
  it('adds a dollar sign to a bare amount', () => {
    expect(formatCompensation('750')).toBe('$750');
    expect(formatCompensation('12.5')).toBe('$12.5');
  });

  it('leaves an already formatted or free-text value alone', () => {
    expect(formatCompensation('$800 hr')).toBe('$800 hr');
    expect(formatCompensation('Negotiable')).toBe('Negotiable');
  });

  it('returns an empty string for an empty value', () => {
    expect(formatCompensation('   ')).toBe('');
  });
});

describe('combineLengthAndTime', () => {
  it('adds units to bare numbers', () => {
    expect(combineLengthAndTime('800', '4')).toBe('800 words / 4 hours');
    expect(combineLengthAndTime('1', '1')).toBe('1 word / 1 hour');
  });

  it('leaves out a blank field', () => {
    expect(combineLengthAndTime('800', '')).toBe('800 words');
    expect(combineLengthAndTime('', '2.5')).toBe('2.5 hours');
    expect(combineLengthAndTime('', '')).toBe('');
  });

  it('keeps legacy free text as it was sent', () => {
    expect(combineLengthAndTime('800 words', '')).toBe('800 words');
  });
});

describe('splitLengthAndTime', () => {
  it('reads both numbers back out of the combined column', () => {
    expect(splitLengthAndTime('800 words / 4 hours')).toEqual({ length: '800', time: '4' });
    expect(splitLengthAndTime('1 word / 1.5 hours')).toEqual({ length: '1', time: '1.5' });
  });

  it('handles either half on its own', () => {
    expect(splitLengthAndTime('800 words')).toEqual({ length: '800', time: '' });
    expect(splitLengthAndTime('2 hours')).toEqual({ length: '', time: '2' });
    expect(splitLengthAndTime('')).toEqual({ length: '', time: '' });
  });

  it('keeps legacy free text intact in length', () => {
    expect(splitLengthAndTime('About a page')).toEqual({ length: 'About a page', time: '' });
  });

  it('round-trips through combineLengthAndTime', () => {
    const { length, time } = splitLengthAndTime(combineLengthAndTime('1200', '3'));
    expect(combineLengthAndTime(length, time)).toBe('1200 words / 3 hours');
  });
});

describe('toDateTimeLocal', () => {
  it('formats a date for a datetime-local input in local time', () => {
    expect(toDateTimeLocal(new Date(2030, 0, 5, 9, 7))).toBe('2030-01-05T09:07');
  });

  it('returns empty for a missing date', () => {
    expect(toDateTimeLocal(null)).toBe('');
  });
});

describe('assignmentToDraft', () => {
  it('fills the form from a saved assignment', () => {
    const draft = assignmentToDraft({
      id: 'a1',
      organizationId: 'org-1',
      createdByUserId: 'user-1',
      title: 'Election night',
      description: 'Live coverage',
      category: 'Reporting/Writing',
      slug: 'election-night-abc123',
      contact: 'Sam Desk',
      location: 'Remote',
      length: '800 words / 4 hours',
      deadline: new Date(2030, 0, 1, 23, 0),
      compensation: '750',
      status: 'open',
      createdAt: new Date(2030, 0, 1),
      updatedAt: new Date(2030, 0, 1),
    });

    expect(draft).toEqual({
      title: 'Election night',
      description: 'Live coverage',
      category: 'Reporting/Writing',
      slug: 'election-night-abc123',
      contact: 'Sam Desk',
      location: 'Remote',
      length: '800',
      time: '4',
      deadline: '2030-01-01T23:00',
      compensation: '750',
    });
  });
});
