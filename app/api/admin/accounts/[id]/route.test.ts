/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { getAccount, reactivateAccount, suspendAccount } from '../../../../../lib/accounts';
import { resolveAppeals } from '../../../../../lib/appeals';
import { isSignedInUserAdmin } from '../../../../../lib/auth';
import { PATCH } from './route';
import type { AccountRow } from '../../../../../lib/accounts';
import type { AdminAccount } from '../../../../types/admin.types';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../../lib/auth', () => ({ isSignedInUserAdmin: jest.fn() }));
jest.mock('../../../../../lib/appeals', () => ({ resolveAppeals: jest.fn() }));
jest.mock('../../../../../lib/accounts', () => ({
  getAccount: jest.fn(),
  suspendAccount: jest.fn(),
  reactivateAccount: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const adminMock = isSignedInUserAdmin as unknown as jest.Mock;
const getAccountMock = getAccount as unknown as jest.Mock;
const suspendMock = suspendAccount as unknown as jest.Mock;
const reactivateMock = reactivateAccount as unknown as jest.Mock;
const resolveMock = resolveAppeals as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const account: AccountRow = {
  id: 'user-1',
  // someone other than the admin making the call
  clerk_id: 'clerk-2',
  email: 'amara@example.com',
  first_name: 'Amara',
  last_name: 'Okafor',
  roles: ['freelancer'],
  suspended_at: null,
  suspension_reason: null,
  created_at: '2026-09-14T10:00:00.000Z',
};

const suspended: AdminAccount = {
  id: 'user-1',
  name: 'Amara Okafor',
  email: 'amara@example.com',
  role: 'freelancer',
  status: 'suspended',
  suspensionReason: 'Spam pitches',
  joinedAt: '2026-09-14T10:00:00.000Z',
};

const patch = (body: unknown, id = 'user-1') =>
  PATCH(
    new Request(`http://localhost/api/admin/accounts/${id}`, {
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  adminMock.mockResolvedValue(true);
  getAccountMock.mockResolvedValue(account);
  resolveMock.mockResolvedValue(undefined);
});

describe('PATCH /api/admin/accounts/[id]', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await patch({ status: 'suspended', reason: 'Spam pitches' });

    expect(response.status).toBe(401);
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('refuses people outside the Story Match team', async () => {
    adminMock.mockResolvedValue(false);

    const response = await patch({ status: 'suspended', reason: 'Spam pitches' });

    expect(response.status).toBe(403);
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('fails closed when the admin check blows up', async () => {
    adminMock.mockRejectedValue(new Error('clerk down'));

    const response = await patch({ status: 'suspended', reason: 'Spam pitches' });

    expect(response.status).toBe(403);
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('needs a reason before suspending', async () => {
    const missing = await patch({ status: 'suspended' });
    expect(missing.status).toBe(400);

    const blank = await patch({ status: 'suspended', reason: '   ' });
    expect(blank.status).toBe(400);

    const tooLong = await patch({ status: 'suspended', reason: 'x'.repeat(501) });
    expect(tooLong.status).toBe(400);

    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown status or a non-JSON body', async () => {
    expect((await patch({ status: 'deleted' })).status).toBe(400);
    expect((await patch('not json')).status).toBe(400);
  });

  it('will not let an admin suspend themselves', async () => {
    getAccountMock.mockResolvedValue({ ...account, id: 'user-9', clerk_id: 'clerk-1' });

    const response = await patch({ status: 'suspended', reason: 'Testing' }, 'user-9');

    expect(response.status).toBe(400);
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('answers 404 for an account that does not exist', async () => {
    getAccountMock.mockResolvedValue(null);

    const response = await patch({ status: 'suspended', reason: 'Spam pitches' });

    expect(response.status).toBe(404);
    expect(suspendMock).not.toHaveBeenCalled();
  });

  it('suspends with the trimmed reason', async () => {
    suspendMock.mockResolvedValue(suspended);

    const response = await patch({ status: 'suspended', reason: '  Spam pitches  ' });

    expect(response.status).toBe(200);
    expect(suspendMock).toHaveBeenCalledWith('user-1', 'Spam pitches');
    expect(resolveMock).not.toHaveBeenCalled();
    expect(await response.json()).toEqual({ account: suspended });
  });

  it('reactivates without needing a reason, closing any open appeal', async () => {
    reactivateMock.mockResolvedValue({ ...suspended, status: 'active', suspensionReason: undefined });

    const response = await patch({ status: 'active' });

    expect(response.status).toBe(200);
    expect(reactivateMock).toHaveBeenCalledWith('user-1');
    expect(resolveMock).toHaveBeenCalledWith('user-1');
    expect(await response.json()).toMatchObject({ account: { status: 'active' } });
  });

  it('reports a failure instead of pretending the change landed', async () => {
    suspendMock.mockRejectedValue(new Error('clerk down'));

    const response = await patch({ status: 'suspended', reason: 'Spam pitches' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to update this account right now.' });
  });
});
