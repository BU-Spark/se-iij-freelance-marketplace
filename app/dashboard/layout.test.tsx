/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isSignedInUserAdmin } from '../../lib/auth';
import { hasProfile } from '../../lib/profile';
import DashboardLayout from './layout';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../lib/profile', () => ({ hasProfile: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const authMock = auth as unknown as jest.Mock;
const isAdminMock = isSignedInUserAdmin as jest.Mock;
const hasProfileMock = hasProfile as jest.Mock;
const redirectMock = redirect as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const render = () => DashboardLayout({ children: 'dashboard' });

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
    isAdminMock.mockResolvedValue(false);
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

    await expect(render()).resolves.toBe('dashboard');
    expect(consoleMock).toHaveBeenCalled();
  });

  it('renders the page when the profile exists', async () => {
    hasProfileMock.mockResolvedValue(true);

    await expect(render()).resolves.toBe('dashboard');
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('sends people with no profile to onboarding', async () => {
    hasProfileMock.mockResolvedValue(false);

    await expect(render()).rejects.toThrow('NEXT_REDIRECT:/onboarding');
    expect(redirectMock).toHaveBeenCalledWith('/onboarding');
  });

  it('lets the page render when the check itself fails', async () => {
    // a database blip must not look like an unfinished profile
    hasProfileMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(render()).resolves.toBe('dashboard');
    expect(redirectMock).not.toHaveBeenCalled();
    expect(consoleMock).toHaveBeenCalled();
  });

  it('sends anonymous visitors to sign in', async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(render()).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(hasProfileMock).not.toHaveBeenCalled();
  });
});
