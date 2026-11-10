import { currentUser } from '@clerk/nextjs/server';
import { isAdminMetadata, isAdminUser, isSignedInUserAdmin, landingPathFor } from './auth';

jest.mock('@clerk/nextjs/server', () => ({ currentUser: jest.fn() }));

const currentUserMock = currentUser as unknown as jest.Mock;

describe('admin role detection', () => {
  it('accepts admin as a single role', () => {
    expect(isAdminMetadata({ role: 'admin' })).toBe(true);
    expect(isAdminMetadata({ role: ' ADMIN ' })).toBe(true);
  });

  it('accepts admin inside a roles array', () => {
    expect(isAdminMetadata({ roles: ['editor', 'admin'] })).toBe(true);
    expect(isAdminMetadata({ roles: ['Admin'] })).toBe(true);
  });

  it('rejects everyone else', () => {
    expect(isAdminMetadata({ role: 'editor' })).toBe(false);
    expect(isAdminMetadata({ roles: ['editor', 'freelancer'] })).toBe(false);
    expect(isAdminMetadata({})).toBe(false);
    expect(isAdminMetadata(null)).toBe(false);
    expect(isAdminMetadata('admin')).toBe(false);
  });

  it('reads the role off a Clerk user', () => {
    expect(isAdminUser({ publicMetadata: { role: 'admin' } })).toBe(true);
    expect(isAdminUser({ publicMetadata: {} })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });

  it('sends admins to the admin area and everyone else to the app', () => {
    expect(landingPathFor({ publicMetadata: { role: 'admin' } })).toBe('/admin');
    expect(landingPathFor({ publicMetadata: { role: 'editor' } })).toBe('/dashboard');
    expect(landingPathFor(null)).toBe('/dashboard');
  });

  it('reads the signed-in user from Clerk', async () => {
    currentUserMock.mockResolvedValue({ publicMetadata: { roles: ['admin'] } });

    await expect(isSignedInUserAdmin()).resolves.toBe(true);

    currentUserMock.mockResolvedValue(null);

    await expect(isSignedInUserAdmin()).resolves.toBe(false);
  });
});
