/**
 * @jest-environment node
 */
import { clerkClient } from '@clerk/nextjs/server';
import { db } from './db';
import { listAdminAccounts, reactivateAccount, suspendAccount, toAdminAccount } from './accounts';
import type { AccountRow } from './accounts';

jest.mock('@clerk/nextjs/server', () => ({ clerkClient: jest.fn() }));
jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;
const clerkClientMock = clerkClient as unknown as jest.Mock;
const banUser = jest.fn();
const unbanUser = jest.fn();

const row: AccountRow = {
  id: 'user-1',
  clerk_id: 'clerk-1',
  email: 'amara@example.com',
  first_name: 'Amara',
  last_name: 'Okafor',
  roles: ['freelancer'],
  suspended_at: null,
  suspension_reason: null,
  created_at: '2026-09-14T10:00:00.000Z',
};

const suspendedRow: AccountRow = {
  ...row,
  suspended_at: '2026-11-11T09:00:00.000Z',
  suspension_reason: 'Spam pitches',
};

describe('toAdminAccount', () => {
  it('calls a row without a suspension active', () => {
    expect(toAdminAccount(row)).toEqual({
      id: 'user-1',
      name: 'Amara Okafor',
      email: 'amara@example.com',
      role: 'freelancer',
      status: 'active',
      joinedAt: '2026-09-14T10:00:00.000Z',
    });
  });

  it('carries the suspension reason while suspended', () => {
    expect(toAdminAccount(suspendedRow)).toMatchObject({
      status: 'suspended',
      suspensionReason: 'Spam pitches',
    });
  });

  it('prefers the editor role and falls back to the email when there is no name', () => {
    const editor = toAdminAccount({ ...row, roles: ['editor', 'freelancer'] });
    expect(editor.role).toBe('editor');

    const anonymous = toAdminAccount({ ...row, first_name: '', last_name: '' });
    expect(anonymous.name).toBe('amara@example.com');
  });
});

describe('listAdminAccounts', () => {
  beforeEach(() => jest.clearAllMocks());

  it('maps every user row onto an account', async () => {
    queryMock.mockResolvedValue({ rows: [row, suspendedRow] });

    const accounts = await listAdminAccounts();

    expect(accounts).toHaveLength(2);
    expect(accounts[1]).toMatchObject({ id: 'user-1', status: 'suspended' });
  });
});

describe('suspendAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clerkClientMock.mockResolvedValue({ users: { banUser, unbanUser } });
    banUser.mockResolvedValue(undefined);
    unbanUser.mockResolvedValue(undefined);
  });

  it('bans in Clerk before recording the reason', async () => {
    queryMock.mockResolvedValueOnce({ rows: [row] }).mockResolvedValueOnce({ rows: [suspendedRow] });

    const account = await suspendAccount('user-1', 'Spam pitches');

    expect(banUser).toHaveBeenCalledWith('clerk-1');
    expect(account).toMatchObject({ status: 'suspended', suspensionReason: 'Spam pitches' });

    const [updateSql, params] = queryMock.mock.calls[1] as [string, unknown[]];
    expect(updateSql).toContain('suspended_at = NOW()');
    expect(params).toEqual(['user-1', 'Spam pitches']);
  });

  it('does nothing for an account that does not exist', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(suspendAccount('missing', 'Spam pitches')).resolves.toBeNull();
    expect(banUser).not.toHaveBeenCalled();
  });

  it('lifts the ban again when the row cannot be saved', async () => {
    queryMock.mockResolvedValueOnce({ rows: [row] }).mockRejectedValueOnce(new Error('db down'));
    const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(suspendAccount('user-1', 'Spam pitches')).rejects.toThrow('db down');
    expect(unbanUser).toHaveBeenCalledWith('clerk-1');

    consoleMock.mockRestore();
  });
});

describe('reactivateAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clerkClientMock.mockResolvedValue({ users: { banUser, unbanUser } });
    banUser.mockResolvedValue(undefined);
    unbanUser.mockResolvedValue(undefined);
  });

  it('unbans in Clerk and clears the reason', async () => {
    queryMock.mockResolvedValueOnce({ rows: [suspendedRow] }).mockResolvedValueOnce({ rows: [row] });

    const account = await reactivateAccount('user-1');

    expect(unbanUser).toHaveBeenCalledWith('clerk-1');
    expect(account).toMatchObject({ status: 'active' });
    expect(account?.suspensionReason).toBeUndefined();

    const [updateSql] = queryMock.mock.calls[1] as [string];
    expect(updateSql).toContain('suspended_at = NULL');
    expect(updateSql).toContain('suspension_reason = NULL');
  });

  it('does nothing for an account that does not exist', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await expect(reactivateAccount('missing')).resolves.toBeNull();
    expect(unbanUser).not.toHaveBeenCalled();
  });
});
