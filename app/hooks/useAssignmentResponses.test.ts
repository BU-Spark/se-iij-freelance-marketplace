import { act, renderHook } from '@testing-library/react';
import { RESPONSES_STORAGE_KEY, useAssignmentResponses } from './useAssignmentResponses';

beforeEach(() => window.localStorage.clear());

it('remembers an answer across renders through localStorage', () => {
  const { result } = renderHook(() => useAssignmentResponses());

  act(() => result.current.respond('a1', { kind: 'interested', at: '2026-01-01T00:00:00Z' }));

  expect(result.current.responses.a1?.kind).toBe('interested');
  expect(JSON.parse(window.localStorage.getItem(RESPONSES_STORAGE_KEY) ?? '{}').a1.kind).toBe('interested');

  const { result: later } = renderHook(() => useAssignmentResponses());
  expect(later.current.responses.a1?.kind).toBe('interested');
});

it('withdraws an answer', () => {
  const { result } = renderHook(() => useAssignmentResponses());

  act(() => result.current.respond('a1', { kind: 'declined', reasons: ['Needs more detail'], note: '', at: 'now' }));
  act(() => result.current.withdraw('a1'));

  expect(result.current.responses.a1).toBeUndefined();
});

it('ignores unreadable stored data', () => {
  window.localStorage.setItem(RESPONSES_STORAGE_KEY, 'not json');
  const { result } = renderHook(() => useAssignmentResponses());

  expect(result.current.responses).toEqual({});
});
