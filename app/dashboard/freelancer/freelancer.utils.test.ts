import { deadlineState } from './freelancer.utils';

describe('deadlineState', () => {
  const now = new Date(2030, 5, 10, 9, 0);

  it('has nothing to say without a deadline or when it is far off', () => {
    expect(deadlineState(null, now)).toBeNull();
    expect(deadlineState(new Date(2030, 5, 20, 17, 0), now)).toBeNull();
  });

  it('flags work due later today', () => {
    expect(deadlineState(new Date(2030, 5, 10, 17, 0), now)).toBe('due-today');
  });

  it('flags work due within three days', () => {
    expect(deadlineState(new Date(2030, 5, 11, 9, 0), now)).toBe('due-soon');
    expect(deadlineState(new Date(2030, 5, 13, 23, 0), now)).toBe('due-soon');
    expect(deadlineState(new Date(2030, 5, 14, 9, 0), now)).toBeNull();
  });

  it('calls a passed deadline overdue, even earlier the same day', () => {
    expect(deadlineState(new Date(2030, 5, 10, 8, 0), now)).toBe('overdue');
    expect(deadlineState(new Date(2030, 5, 1), now)).toBe('overdue');
  });
});
