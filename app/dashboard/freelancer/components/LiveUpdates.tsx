'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { PitchStatus } from '../../../types/dashboard.types';
import { useToast, type ToastType } from '../../../components/Toast/ToastProvider';
import { pitchHeading } from '../../../utils/pitch.utils';

/** How often an open freelancer page checks for the editor's changes */
export const POLL_MS = 30_000;
/** Last statuses this browser saw, so a change made while away still gets announced */
export const SEEN_KEY = 'freelancer:pitch-statuses';

type SentPitch = { id: string; slug: string; status: PitchStatus };
type Seen = Record<string, PitchStatus>;

/** What the freelancer is told when the editor moves one of their pitches; `new` never needs a notice */
export function statusNotice(pitch: SentPitch): { message: string; type: ToastType } | null {
  const title = `“${pitchHeading(pitch.slug)}”`;
  switch (pitch.status) {
    case 'reviewed':
      return { message: `The editor has read ${title}.`, type: 'info' };
    case 'negotiating':
      return { message: `The editor proposed changes to ${title}.`, type: 'info' };
    case 'accepted':
      return { message: `${title} was accepted.`, type: 'success' };
    case 'declined':
      return { message: `${title} was declined. Their feedback is on the pitch.`, type: 'info' };
    default:
      return null;
  }
}

// Storage can be missing or blocked (private windows); the page must work without it
const readSeen = (): Seen | null => {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as Seen) : null;
  } catch {
    return null;
  }
};

const writeSeen = (seen: Seen) => {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // nothing to do: the next visit just won't know what was already announced
  }
};

/**
 * Keeps the freelancer workspace in step with the editor's desk while it is open: every half
 * minute (and whenever the tab comes back into view) it reloads the server data behind the page,
 * and announces any pitch whose review status changed since this browser last looked.
 */
export default function LiveUpdates() {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const announceChanges = async () => {
      const response = await fetch('/api/pitches?scope=sent', { cache: 'no-store' });
      if (!response.ok) return;
      const { items = [] } = (await response.json()) as { items?: SentPitch[] };
      if (cancelled) return;

      const seen = readSeen();
      // First visit on this browser: remember where things stand without a burst of old news
      if (seen) {
        for (const pitch of items) {
          const notice = seen[pitch.id] && seen[pitch.id] !== pitch.status ? statusNotice(pitch) : null;
          if (notice) showToast(notice.message, notice.type);
        }
      }
      writeSeen(Object.fromEntries(items.map((pitch) => [pitch.id, pitch.status])));
    };

    const check = async (reload = true) => {
      if (document.visibilityState !== 'visible') return;
      // offline or a server hiccup is not worth a toast; the next tick tries again
      await announceChanges().catch(() => {});
      // assignments and invitations change too, so the page's server data is reloaded as well
      if (reload && !cancelled) router.refresh();
    };

    // the page was just rendered, so the first check only looks at pitches
    check(false);
    const tick = () => check();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, showToast]);

  return null;
}
