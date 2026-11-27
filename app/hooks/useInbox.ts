'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import type { ProfileRole } from '../types/profile.types';
import type { InboxSources } from '../types/inbox.types';
import { editorUpdates, freelancerUpdates, sortUpdates, type InboxPitch } from '../utils/inbox.utils';

/** How often an open page checks for new updates */
const POLL_MS = 30_000;
/** tells the hook to re-read; the browser's `storage` event only covers other tabs */
const CHANGED = 'inbox-read-changed';

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGED, onChange);
  };
};

const readRaw = (key: string) => {
  try {
    return window.localStorage.getItem(key) ?? '[]';
  } catch {
    return '[]';
  }
};

const parse = (raw: string | null): string[] => {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
};

const NO_SOURCES: InboxSources = { newAssignments: [], savedBy: [], answers: [] };

/**
 * The updates for the side of the desk being viewed. Which ones have been read is remembered in this
 * browser, per account, so it does not follow the person to another device.
 */
export function useInbox(role: ProfileRole, accountId = '', sources: InboxSources = NO_SOURCES) {
  const pathname = usePathname();
  const [loaded, setLoaded] = useState<{ role: ProfileRole; pitches: InboxPitch[] } | null>(null);

  // reloads on every page change too, so the count catches up after pitches have been read
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const url = role === 'editor' ? '/api/pitches' : '/api/pitches?scope=sent';
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return;
        const { items } = (await response.json()) as { items?: InboxPitch[] };
        if (!cancelled) setLoaded({ role, pitches: Array.isArray(items) ? items : [] });
      } catch {
        // offline or a server hiccup: keep what is shown and try again on the next check
      }
    };

    void load();
    const timer = setInterval(load, POLL_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [role, pathname]);

  const storageKey = `inbox-read:${accountId}`;
  // null on the server and during hydration, where browser storage cannot be read
  const raw = useSyncExternalStore(
    subscribe,
    // and until the account is known, there is no record of what it has read
    () => (accountId ? readRaw(storageKey) : null),
    () => null
  );

  const pitches = loaded?.role === role ? loaded.pitches : null;

  const items = useMemo(() => {
    const updates =
      role === 'editor' ? editorUpdates(pitches ?? [], sources.answers) : freelancerUpdates(pitches ?? [], sources);
    const read = new Set(parse(raw));

    return sortUpdates(
      updates.map((item) => ({
        ...item,
        // nothing counts as unread until we know what this person has already read
        unread: raw !== null && !item.handled && !read.has(item.key),
      }))
    );
  }, [role, pitches, sources, raw]);

  const markRead = (keys: string[]) => {
    try {
      const next = [...new Set([...parse(readRaw(storageKey)), ...keys])];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGED));
    } catch (error) {
      console.error('Could not remember which updates were read.', error);
    }
  };

  return {
    items,
    loading: pitches === null && items.length === 0,
    unreadCount: items.filter((item) => item.unread).length,
    markRead,
  };
}

export type Inbox = ReturnType<typeof useInbox>;
