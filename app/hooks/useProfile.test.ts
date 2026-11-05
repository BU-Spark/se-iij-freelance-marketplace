import { createProfileStore } from './useProfile';
import type { AccountProfile } from '../types/profile.types';

const jsonResponse = (status: number, body: unknown) =>
  ({ ok: status < 400, status, json: async () => body }) as unknown as Response;

const profile: AccountProfile = {
  id: 'user-1',
  basic: {
    firstName: 'Sarah',
    lastName: 'Jenkins',
    email: 'sarah@newsroom.example',
    shortBio: '',
    longBio: '',
  },
  roles: [],
};

describe('profile store', () => {
  it('loads the profile when the API has one', async () => {
    const store = createProfileStore(async () => jsonResponse(200, profile));

    await store.load();

    expect(store.getState()).toMatchObject({ profile, loading: false, error: null, needsOnboarding: false });
  });

  it('flags onboarding instead of an error when there is no profile yet', async () => {
    const request = jest.fn(async () =>
      jsonResponse(404, { error: 'No profile yet. Finish onboarding to create one.' })
    );
    const store = createProfileStore(request);

    await store.load();

    expect(store.getState()).toMatchObject({ profile: null, needsOnboarding: true, error: null, loading: false });
  });

  it('reports a real failure as an error', async () => {
    const store = createProfileStore(async () =>
      jsonResponse(500, { error: 'Unable to load your profile right now.' })
    );

    await store.load();

    expect(store.getState()).toMatchObject({ error: 'Unable to load your profile right now.', needsOnboarding: false });
  });

  it('takes the profile the server returns after a save', async () => {
    const saved = { ...profile, basic: { ...profile.basic, firstName: 'Sara' } };
    const request = jest.fn(async (method: string) => jsonResponse(200, method === 'GET' ? profile : saved));
    const store = createProfileStore(request);

    await expect(store.saveBasic({ ...saved.basic })).resolves.toBe(true);

    expect(store.getState().profile?.basic.firstName).toBe('Sara');
    expect(request).toHaveBeenCalledWith('PATCH', { section: 'basic', basic: saved.basic });
  });

  it('clears the cached profile when the row disappears during a save', async () => {
    const request = jest.fn(async () =>
      jsonResponse(404, { error: 'No profile yet. Finish onboarding to create one.' })
    );
    const store = createProfileStore(request);

    await expect(store.saveBasic(profile.basic)).resolves.toBe(false);

    expect(store.getState()).toMatchObject({ profile: null, needsOnboarding: true, error: null });
  });

  it('notifies subscribers on every change', async () => {
    const store = createProfileStore(async () => jsonResponse(200, profile));
    const seen: (string | null)[] = [];
    store.subscribe((next) => seen.push(next.profile?.id ?? null));

    await store.load();

    expect(seen).toEqual([null, 'user-1']);
  });
});
