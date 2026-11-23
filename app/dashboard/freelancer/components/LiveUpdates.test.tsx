import { act, render } from '@testing-library/react';
import LiveUpdates, { POLL_MS, SEEN_KEY, statusNotice } from './LiveUpdates';

const refresh = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

const showToast = jest.fn();
jest.mock('../../../components/Toast/ToastProvider', () => ({ useToast: () => ({ showToast }) }));

const serve = (items: { id: string; slug: string; status: string }[]) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ items }) }) as jest.Mock;
};

// lets the fetch → json → toast chain finish
const settle = () => act(async () => {});

describe('statusNotice', () => {
  it('words each review step for the freelancer', () => {
    expect(statusNotice({ id: '1', slug: 'transit-fares', status: 'accepted' })).toEqual({
      message: '“Transit fares” was accepted.',
      type: 'success',
    });
    expect(statusNotice({ id: '1', slug: 'transit-fares', status: 'negotiating' })?.message).toBe(
      'The editor proposed changes to “Transit fares”.'
    );
    expect(statusNotice({ id: '1', slug: 'transit-fares', status: 'new' })).toBeNull();
  });
});

describe('LiveUpdates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    window.localStorage.clear();
  });
  afterEach(() => jest.useRealTimers());

  it('remembers statuses on the first visit without announcing anything', async () => {
    serve([{ id: 'p1', slug: 'budget', status: 'accepted' }]);
    render(<LiveUpdates />);
    await settle();

    expect(global.fetch).toHaveBeenCalledWith('/api/pitches?scope=sent', { cache: 'no-store' });
    expect(showToast).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(JSON.parse(window.localStorage.getItem(SEEN_KEY)!)).toEqual({ p1: 'accepted' });
  });

  it('announces a pitch the editor moved since the last look, once', async () => {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify({ p1: 'new', p2: 'reviewed' }));
    serve([
      { id: 'p1', slug: 'budget', status: 'accepted' },
      { id: 'p2', slug: 'fair', status: 'reviewed' },
    ]);
    render(<LiveUpdates />);
    await settle();

    expect(showToast).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith('“Budget” was accepted.', 'success');

    // the next tick sees the same statuses, so nothing is repeated
    await act(async () => jest.advanceTimersByTime(POLL_MS));
    expect(showToast).toHaveBeenCalledTimes(1);
  });

  it('reloads the page data on every tick, even when the pitch check fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as jest.Mock;
    render(<LiveUpdates />);
    await settle();

    await act(async () => jest.advanceTimersByTime(POLL_MS));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(showToast).not.toHaveBeenCalled();
  });

  it('stops checking once the page is left', async () => {
    serve([]);
    const { unmount } = render(<LiveUpdates />);
    await settle();
    unmount();

    await act(async () => jest.advanceTimersByTime(POLL_MS * 3));
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
