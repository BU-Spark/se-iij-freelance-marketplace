import { act, renderHook, waitFor } from '@testing-library/react';
import { useAssignmentResponses } from './useAssignmentResponses';

const json = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

it('loads the saved answers from the server, not the browser', async () => {
  fetchMock.mockResolvedValueOnce(json({ responses: { a1: { kind: 'interested', at: '2026-01-01T00:00:00.000Z' } } }));

  const { result } = renderHook(() => useAssignmentResponses());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetchMock).toHaveBeenCalledWith('/api/assignments/responses');
  expect(result.current.responses.a1?.kind).toBe('interested');
});

it('shows the answer only once the server has saved it', async () => {
  fetchMock.mockResolvedValueOnce(json({ responses: {} }));
  const { result } = renderHook(() => useAssignmentResponses());
  await waitFor(() => expect(result.current.loading).toBe(false));

  const saved = { kind: 'declined', reasons: ['Needs more detail'], note: '', at: '2026-01-02T00:00:00.000Z' };
  fetchMock.mockResolvedValueOnce(json({ response: saved }));

  let outcome;
  await act(async () => {
    outcome = await result.current.respond('a1', { kind: 'declined', reasons: ['Needs more detail'] });
  });

  expect(outcome).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/assignments/a1/response',
    expect.objectContaining({ method: 'PUT' })
  );
  expect(result.current.responses.a1).toEqual(saved);
});

it('keeps the old state and passes the server message on when saving fails', async () => {
  fetchMock.mockResolvedValueOnce(json({ responses: {} }));
  const { result } = renderHook(() => useAssignmentResponses());
  await waitFor(() => expect(result.current.loading).toBe(false));

  fetchMock.mockResolvedValueOnce(json({ error: 'This assignment is no longer taking answers.' }, 404));

  let outcome;
  await act(async () => {
    outcome = await result.current.respond('a1', { kind: 'interested' });
  });

  expect(outcome).toEqual({ ok: false, error: 'This assignment is no longer taking answers.' });
  expect(result.current.responses.a1).toBeUndefined();
});

it('withdraws an answer', async () => {
  fetchMock.mockResolvedValueOnce(json({ responses: { a1: { kind: 'interested', at: 'now' } } }));
  const { result } = renderHook(() => useAssignmentResponses());
  await waitFor(() => expect(result.current.responses.a1).toBeDefined());

  fetchMock.mockResolvedValueOnce(json({ withdrawn: true }));
  await act(async () => {
    await result.current.withdraw('a1');
  });

  expect(fetchMock).toHaveBeenLastCalledWith('/api/assignments/a1/response', { method: 'DELETE' });
  expect(result.current.responses.a1).toBeUndefined();
});

it('reports a load failure instead of pretending there are no answers', async () => {
  fetchMock.mockResolvedValueOnce(json({ error: 'Only freelancers answer assignments.' }, 403));

  const { result } = renderHook(() => useAssignmentResponses());

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.error).toBe('Only freelancers answer assignments.');
});
