'use client';

import { useEffect, useState } from 'react';
import type { AccountProfile, BasicInfo, RoleDetails } from '../types/profile.types';

/**
 * One shared copy of the signed-in user's profile.
 *
 * The header and the profile panel both need it, and an edit in the panel has to update the
 * name next to the avatar, so the state lives in the store below rather than in either
 * component. The store takes its request function as an argument so it can be tested without
 * React or a live server.
 */

export type ProfileState = {
  profile: AccountProfile | null;
  loading: boolean;
  error: string | null;
  /** There is no row in users yet, so the answer is onboarding rather than an edit form. */
  needsOnboarding: boolean;
};

type ProfileRequest = (method: 'GET' | 'PATCH', body?: unknown) => Promise<Response>;

const FALLBACK_ERROR = 'Unable to save your profile right now.';

const readError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return FALLBACK_ERROR;
};

const messageOf = (error: unknown) => (error instanceof Error && error.message ? error.message : FALLBACK_ERROR);

const defaultRequest: ProfileRequest = (method, body) =>
  fetch('/api/profile', {
    method,
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });

export function createProfileStore(request: ProfileRequest = defaultRequest) {
  let state: ProfileState = { profile: null, loading: false, error: null, needsOnboarding: false };
  const listeners = new Set<(next: ProfileState) => void>();

  const publish = (patch: Partial<ProfileState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener(state));
  };

  const load = async (): Promise<void> => {
    if (state.loading) return;

    publish({ loading: true });

    try {
      const response = await request('GET');

      // a missing profile is a state, not a failure: the caller sends them to onboarding
      if (response.status === 404) {
        publish({ profile: null, loading: false, error: null, needsOnboarding: true });
        return;
      }

      if (!response.ok) {
        publish({ loading: false, error: await readError(response) });
        return;
      }

      publish({
        profile: (await response.json()) as AccountProfile,
        loading: false,
        error: null,
        needsOnboarding: false,
      });
    } catch (error) {
      publish({ loading: false, error: messageOf(error) });
    }
  };

  const save = async (payload: unknown): Promise<boolean> => {
    try {
      const response = await request('PATCH', payload);

      // the row vanished underneath us, e.g. it was deleted in another tab
      if (response.status === 404) {
        publish({ needsOnboarding: true, error: null });
        return false;
      }

      if (!response.ok) {
        publish({ error: await readError(response) });
        return false;
      }

      publish({ profile: (await response.json()) as AccountProfile, error: null, needsOnboarding: false });
      return true;
    } catch (error) {
      publish({ error: messageOf(error) });
      return false;
    }
  };

  return {
    getState: () => state,
    subscribe: (listener: (next: ProfileState) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load,
    saveBasic: (basic: BasicInfo) => save({ section: 'basic', basic }),
    saveRole: (details: RoleDetails) => save({ section: 'role', role: details.role, facts: details.facts }),
  };
}

export const profileStore = createProfileStore();

export const loadProfile = profileStore.load;

export function useProfile() {
  const [snapshot, setSnapshot] = useState<ProfileState>(profileStore.getState());

  useEffect(() => {
    const unsubscribe = profileStore.subscribe(setSnapshot);
    // the store may have finished loading between render and subscribe
    const current = profileStore.getState();
    setSnapshot(current);
    if (!current.profile && !current.needsOnboarding && typeof fetch === 'function') void profileStore.load();

    return unsubscribe;
  }, []);

  return {
    ...snapshot,
    refresh: profileStore.load,
    saveBasic: profileStore.saveBasic,
    saveRole: profileStore.saveRole,
  };
}
