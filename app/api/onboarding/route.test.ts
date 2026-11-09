/**
 * @jest-environment node
 */
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '../../../lib/db';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));
jest.mock('../../../lib/db', () => ({ db: { connect: jest.fn() } }));
jest.mock('../../../lib/s3', () => ({ isPhotoKeyFor: jest.fn(() => true) }));

const authMock = auth as unknown as jest.Mock;
const currentUserMock = currentUser as unknown as jest.Mock;
const connectMock = db.connect as unknown as jest.Mock;

/** A Clerk user whose email addresses carry the given verification states */
const clerkUser = (...addresses: { emailAddress: string; status: string }[]) => ({
  emailAddresses: addresses.map((address) => ({
    emailAddress: address.emailAddress,
    verification: { status: address.status },
  })),
});

const makeClient = () => {
  const query = jest.fn(async (sql: string) => {
    if (['BEGIN', 'COMMIT', 'ROLLBACK'].includes(sql)) return { rowCount: 0, rows: [] };
    if (sql.includes('INSERT INTO users')) return { rowCount: 1, rows: [{ id: 'user-1' }] };
    return { rowCount: 1, rows: [] };
  });

  return { query, release: jest.fn() };
};

const editor = {
  jobTitle: 'News Editor',
  yearsAtDesk: 4,
  desks: ['Politics'],
  pitchPreferences: { preferredPitchFormat: 'Email', averageResponseTime: 3 },
};

const payload = (roles: string[]) => ({
  roles,
  user: {
    email: 'sarah@newsroom.example',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    roles: roles.map((role) => role.toUpperCase()),
  },
  editor: roles.includes('editor') ? editor : undefined,
  freelancer: roles.includes('freelancer') ? { reportingBeats: ['Politics'], workMediums: ['Text'] } : undefined,
});

const request = (body: unknown) =>
  new Request('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  currentUserMock.mockResolvedValue(clerkUser());
  connectMock.mockResolvedValue(makeClient());
});

describe('POST /api/onboarding', () => {
  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    expect((await POST(request(payload(['editor'])))).status).toBe(401);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('requires an editor to verify the work email first', async () => {
    currentUserMock.mockResolvedValue(clerkUser({ emailAddress: 'sarah@newsroom.example', status: 'unverified' }));

    const response = await POST(request(payload(['editor'])));

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/verify your work email/i);
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('saves an editor whose work email Clerk has verified', async () => {
    currentUserMock.mockResolvedValue(clerkUser({ emailAddress: 'Sarah@Newsroom.Example', status: 'verified' }));
    const client = makeClient();
    connectMock.mockResolvedValue(client);

    const response = await POST(request(payload(['editor'])));

    expect(response.status).toBe(200);
    expect(currentUserMock).toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      expect.arrayContaining(['clerk-1', 'sarah@newsroom.example'])
    );
  });

  it('does not ask Clerk for a freelancer-only profile', async () => {
    const response = await POST(request(payload(['freelancer'])));

    expect(response.status).toBe(200);
    expect(currentUserMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the Clerk lookup fails', async () => {
    currentUserMock.mockRejectedValue(new Error('clerk down'));

    expect((await POST(request(payload(['editor'])))).status).toBe(500);
    expect(connectMock).not.toHaveBeenCalled();
  });
});
