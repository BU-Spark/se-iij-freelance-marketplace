/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSignedInUserAdmin } from '../../lib/auth';
import { hasProfile, loadProfileRoles } from '../../lib/profile';
import { EditorHeader } from '../components/header/EditorHeader';
import ProfileUnavailable from './ProfileUnavailable';
import DashboardLayout from './layout';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../lib/profile', () => ({ hasProfile: jest.fn(), loadProfileRoles: jest.fn() }));
jest.mock('../components/header/EditorHeader', () => ({ EditorHeader: () => null }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const authMock = auth as unknown as jest.Mock;
const isAdminMock = isSignedInUserAdmin as jest.Mock;
const hasProfileMock = hasProfile as jest.Mock;
const loadRolesMock = loadProfileRoles as jest.Mock;
const redirectMock = redirect as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const render = () => DashboardLayout({ children: 'dashboard' });

/** The layout's frame: the shared header, then the page */
type Frame = {
  props: { children: [{ type: unknown; props: { initialRoles: string[] } }, { props: { children: unknown } }] };
};
const pageIn = (tree: unknown) => (tree as Frame).props.children[1].props.children;
const headerIn = (tree: unknown) => (tree as Frame).props.children[0];

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    isAdminMock.mockResolvedValue(false);
    loadRolesMock.mockResolvedValue(['editor']);
  });

  it('sends admins to the admin area', async () => {
    isAdminMock.mockResolvedValue(true);

    await expect(render()).rejects.toThrow('NEXT_REDIRECT:/admin');
    expect(redirectMock).toHaveBeenCalledWith('/admin');
    expect(hasProfileMock).not.toHaveBeenCalled();
  });

  it('keeps people in the app when the admin check fails', async () => {
    isAdminMock.mockRejectedValue(new Error('clerk down'));
    hasProfileMock.mockResolvedValue(true);

    expect(pageIn(await render())).toBe('dashboard');
    expect(consoleMock).toHaveBeenCalled();
  });

  it('renders the page when the profile exists', async () => {
    hasProfileMock.mockResolvedValue(true);

    expect(pageIn(await render())).toBe('dashboard');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('sends people with no profile to onboarding', async () => {
    hasProfileMock.mockResolvedValue(false);

    await expect(render()).rejects.toThrow('NEXT_REDIRECT:/onboarding');
    expect(redirectMock).toHaveBeenCalledWith('/onboarding');
  });

  it('does not open the dashboard when the profile check itself fails', async () => {
    // failing open here is how people slipped past onboarding when the database was unreachable
    hasProfileMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const tree = await render();

    expect(redirectMock).not.toHaveBeenCalled();
    expect(tree.type).toBe(ProfileUnavailable);
    expect(consoleMock).toHaveBeenCalled();
  });

  it('sends anonymous visitors to sign in', async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(render()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(hasProfileMock).not.toHaveBeenCalled();
  });

  it('mounts the shared header once, with the roles the server read', async () => {
    hasProfileMock.mockResolvedValue(true);
    loadRolesMock.mockResolvedValue(['freelancer']);

    const header = headerIn(await render());
    expect(header.type).toBe(EditorHeader);
    expect(header.props.initialRoles).toEqual(['freelancer']);
  });

  it('still renders the header when the roles cannot be read', async () => {
    hasProfileMock.mockResolvedValue(true);
    loadRolesMock.mockRejectedValue(new Error('ECONNREFUSED'));

    expect(headerIn(await render()).props.initialRoles).toEqual([]);
  });
});
