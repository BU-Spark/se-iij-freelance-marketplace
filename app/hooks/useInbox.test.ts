import { act, renderHook, waitFor } from '@testing-library/react';
import { useInbox } from './useInbox';

jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));

const PITCH = {
  id: 'p-1',
  slug: 'shadow-budget',
  status: 'accepted',
  freelancer: { id: 'f-1', name: 'Maria Lopez' },
  submittedAt: '2026-11-20T10:00:00.000Z',
};

const fetchMock = jest.fn();

describe('useInbox', () => {
  beforeEach(() => {
    window.localStorage.clear();
    fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ items: [PITCH] }) });
    global.fetch = fetchMock;
  });

  it('asks for sent pitches on the freelancer side', async () => {
    const { result } = renderHook(() => useInbox('freelancer', 'u-1'));

    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/pitches?scope=sent', { cache: 'no-store' });
  });

  it('asks for received pitches on the editor side', async () => {
    const { result } = renderHook(() => useInbox('editor', 'u-1'));

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/pitches', { cache: 'no-store' });
  });

  it('remembers what was read for this account', async () => {
    const first = renderHook(() => useInbox('freelancer', 'u-1'));
    await waitFor(() => expect(first.result.current.unreadCount).toBe(1));

    act(() => first.result.current.markRead([first.result.current.items[0].key]));
    expect(first.result.current.unreadCount).toBe(0);
    first.unmount();

    const again = renderHook(() => useInbox('freelancer', 'u-1'));
    await waitFor(() => expect(again.result.current.items).toHaveLength(1));
    expect(again.result.current.unreadCount).toBe(0);

    const someoneElse = renderHook(() => useInbox('freelancer', 'u-2'));
    await waitFor(() => expect(someoneElse.result.current.unreadCount).toBe(1));
  });

  it('counts nothing as unread until the account is known', async () => {
    const { result } = renderHook(() => useInbox('freelancer'));

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.unreadCount).toBe(0);
  });

  it('stays quiet when the pitches cannot be loaded', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useInbox('freelancer', 'u-1'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.items).toEqual([]);
  });
});
