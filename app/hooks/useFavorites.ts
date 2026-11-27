'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { useToast } from '../components/Toast/ToastProvider';

/** tells other hooks in this tab to re-read; the browser's `storage` event only covers other tabs */
const CHANGED = 'favorites-changed';

const subscribe = (onChange: () => void) => {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGED, onChange);

  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGED, onChange);
  };
};

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key) ?? '[]';
  } catch (error) {
    console.error('Could not read favorites.', error);
    return '[]';
  }
};

const parse = (raw: string | null): string[] => {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

/**
 * The freelancers an editor has hearted. Favorites are separate from the roster and nobody is one
 * until they are clicked. They live in this browser, keyed by editor, so they do not follow the
 * editor to another device.
 */
export function useFavorites(editorId: string) {
  const { showToast } = useToast();
  const key = `favorite-freelancers:${editorId}`;
  // null on the server and during hydration, where browser storage cannot be read
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );
  const ids = useMemo(() => parse(raw), [raw]);

  const toggle = ({ id, name }: { id: string; name: string }) => {
    const current = parse(read(key));
    const adding = !current.includes(id);

    try {
      const next = adding ? [...current, id] : current.filter((value) => value !== id);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (error) {
      console.error('Could not save favorites.', error);
      showToast('Could not update your favorites in this browser.', 'error');
      return;
    }

    window.dispatchEvent(new Event(CHANGED));
    showToast(adding ? `Added ${name} to your favorites` : `Removed ${name} from your favorites`);
  };

  return { ids, ready: raw !== null, toggle };
}
