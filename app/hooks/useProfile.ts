'use client';

import { useEffect, useState } from 'react';
import type { AccountProfile, BasicInfo, ProfileRole, RoleDetails } from '../types/profile.types';

/**
 * One shared copy of the signed-in user's profile.
 *
 * The header and the profile panel both need it, and an edit in the panel has to update the
 * name next to the avatar, so the state lives in this module rather than in either component.
 */

type ProfileState = {
  profile: AccountProfile | null;
  loading: boolean;
  error: string | null;
};

const FALLBACK_ERROR = 'Unable to save your profile right now.';

let state: ProfileState = { profile: null, loading: false, error: null };
const listeners = new Set<(next: ProfileState) => void>();

const publish = (patch: Partial<ProfileState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener(state));
};

const readError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return FALLBACK_ERROR;
};

async function request(method: 'GET' | 'PATCH', body?: unknown): Promise<AccountProfile> {
  const response = await fetch('/api/profile', {
    method,
    ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });

  if (!response.ok) throw new Error(await readError(response));

  return (await response.json()) as AccountProfile;
}

const messageOf = (error: unknown) => (error instanceof Error && error.message ? error.message : FALLBACK_ERROR);

export async function loadProfile(): Promise<void> {
  // jsdom has no fetch, and there is nothing to load before the page is live
  if (typeof fetch !== 'function' || state.loading) return;

  publish({ loading: true });

  try {
    publish({ profile: await request('GET'), loading: false, error: null });
  } catch (error) {
    publish({ loading: false, error: messageOf(error) });
  }
}

async function save(payload: unknown): Promise<boolean> {
  try {
    publish({ profile: await request('PATCH', payload), error: null });
    return true;
  } catch (error) {
    publish({ error: messageOf(error) });
    return false;
  }
}

export function useProfile() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    // the store may have finished loading between render and subscribe
    setSnapshot(state);
    if (!state.profile) void loadProfile();

    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  return {
    ...snapshot,
    refresh: loadProfile,
    saveBasic: (basic: BasicInfo) => save({ section: 'basic', basic }),
    saveRole: (details: RoleDetails) => save({ section: 'role', role: details.role, facts: details.facts }),
    addRole: (role: ProfileRole) => save({ section: 'addRole', role }),
  };
}
