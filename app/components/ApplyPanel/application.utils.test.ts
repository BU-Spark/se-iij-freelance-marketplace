import { emptyDraft, toWebAddress, validateApplication } from './application.utils';

describe('toWebAddress', () => {
  it('accepts web addresses, with or without https', () => {
    expect(toWebAddress('example.com/a')).toBe('https://example.com/a');
    expect(toWebAddress(' http://example.com ')).toBe('http://example.com/');
  });

  it('rejects everything else', () => {
    expect(toWebAddress('javascript:alert(1)')).toBeNull();
    expect(toWebAddress('my story')).toBeNull();
    expect(toWebAddress('story')).toBeNull();
  });
});

describe('validateApplication', () => {
  it('asks for a note, a work sample and the deadline', () => {
    const errors = validateApplication(emptyDraft(), { deadline: true });

    expect(errors.note).toBeDefined();
    expect(errors.samples?.[0]).toBe('Add at least one link to your work.');
    expect(errors.meetsDeadline).toBeDefined();
  });

  it('asks for the rate only when proposing a different one', () => {
    const draft = { ...emptyDraft(['example.com/a']), note: 'Hello' };

    expect(validateApplication(draft, { deadline: false })).toEqual({});
    expect(validateApplication({ ...draft, rateChoice: 'other' }, { deadline: false }).rate).toBeDefined();
  });
});
