/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { submitFlag } from '../../../lib/flags';
import { POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/flags', () => ({ submitFlag: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const submitMock = submitFlag as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const TARGET_ID = '11111111-1111-4111-8111-111111111111';

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/flags', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  submitMock.mockResolvedValue({ status: 'recorded', duplicate: false });
});

describe('POST /api/flags', () => {
  it('needs a session', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await post({ targetType: 'assignment', targetId: TARGET_ID, reason: 'Spam' });

    expect(response.status).toBe(401);
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('accepts a report without trusting a client label', async () => {
    const response = await post({
      targetType: 'assignment',
      targetId: TARGET_ID,
      targetLabel: 'A label the client made up',
      reason: '  The pay is below the posted minimum.  ',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: false });
    expect(submitMock).toHaveBeenCalledWith({
      reporterClerkId: 'clerk-1',
      targetType: 'assignment',
      targetId: TARGET_ID,
      reason: 'The pay is below the posted minimum.',
    });
  });

  it('says a repeat tap was already received', async () => {
    submitMock.mockResolvedValue({ status: 'recorded', duplicate: true });

    const response = await post({ targetType: 'account', targetId: TARGET_ID, reason: 'Impersonation' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true, duplicate: true });
  });

  it('needs a real target type, id and reason', async () => {
    expect((await post('not json')).status).toBe(400);
    expect((await post({ targetType: 'comment', targetId: TARGET_ID, reason: 'Spam' })).status).toBe(400);
    expect((await post({ targetType: 'assignment', reason: 'Spam' })).status).toBe(400);
    expect((await post({ targetType: 'assignment', targetId: TARGET_ID, reason: '   ' })).status).toBe(400);
    expect((await post({ targetType: 'assignment', targetId: TARGET_ID, reason: 'x'.repeat(501) })).status).toBe(400);

    expect(submitMock).not.toHaveBeenCalled();
  });

  it('explains when the reporter still has to onboard', async () => {
    submitMock.mockResolvedValue({ status: 'not-onboarded' });

    const response = await post({ targetType: 'pitch', targetId: TARGET_ID, reason: 'Spam' });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'onboarding_required' });
  });

  it('answers 404 for content that is gone', async () => {
    submitMock.mockResolvedValue({ status: 'not-found' });

    const response = await post({ targetType: 'pitch', targetId: TARGET_ID, reason: 'Spam' });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'That content could not be found.' });
  });

  it('refuses a report on the caller’s own content', async () => {
    submitMock.mockResolvedValue({ status: 'own' });

    const response = await post({ targetType: 'assignment', targetId: TARGET_ID, reason: 'Spam' });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'You cannot report your own content.' });
  });

  it('reports a failure when the flag cannot be stored', async () => {
    submitMock.mockRejectedValue(new Error('db down'));

    const response = await post({ targetType: 'assignment', targetId: TARGET_ID, reason: 'Spam' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to send the report right now.' });
  });
});
