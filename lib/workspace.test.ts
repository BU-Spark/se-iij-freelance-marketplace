/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { loadProfileRoles } from './profile';
import { requireWorkspace } from './workspace';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('./profile', () => ({ loadProfileRoles: jest.fn() }));
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const authMock = auth as unknown as jest.Mock;
const rolesMock = loadProfileRoles as jest.Mock;
const redirectMock = redirect as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('requireWorkspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockResolvedValue({ userId: 'clerk-1' });
  });

  it('lets editors into the editor desk', async () => {
    rolesMock.mockResolvedValue(['editor']);

    await expect(requireWorkspace('editor')).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('lets people with both roles into either workspace', async () => {
    rolesMock.mockResolvedValue(['freelancer', 'editor']);

    await expect(requireWorkspace('editor')).resolves.toBeUndefined();
    await expect(requireWorkspace('freelancer')).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('turns a freelancer away from the editor desk', async () => {
    rolesMock.mockResolvedValue(['freelancer']);

    await expect(requireWorkspace('editor')).rejects.toThrow('NEXT_REDIRECT:/dashboard/freelancer');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard/freelancer');
  });

  it('turns an editor away from the freelancer workspace', async () => {
    rolesMock.mockResolvedValue(['editor']);

    await expect(requireWorkspace('freelancer')).rejects.toThrow('NEXT_REDIRECT:/dashboard');
    expect(redirectMock).toHaveBeenCalledWith('/dashboard');
  });

  it('sends anonymous visitors to sign in', async () => {
    authMock.mockResolvedValue({ userId: null });

    await expect(requireWorkspace('editor')).rejects.toThrow('NEXT_REDIRECT:/login');
    expect(rolesMock).not.toHaveBeenCalled();
  });

  it('fails open when the role lookup breaks', async () => {
    rolesMock.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(requireWorkspace('editor')).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
    expect(consoleMock).toHaveBeenCalled();
  });

  it('fails open when the profile has no roles yet', async () => {
    rolesMock.mockResolvedValue([]);

    await expect(requireWorkspace('editor')).resolves.toBeUndefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
