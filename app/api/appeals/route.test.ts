/**
 * @jest-environment node
 */
import { submitAppeal } from '../../../lib/appeals';
import { POST } from './route';

jest.mock('../../../lib/appeals', () => ({ submitAppeal: jest.fn() }));

const submitMock = submitAppeal as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/appeals', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  );

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  submitMock.mockResolvedValue(undefined);
});

describe('POST /api/appeals', () => {
  it('accepts an appeal without a session, because a ban blocks sign-in', async () => {
    const response = await post({ email: 'amara@example.com', message: 'Please look again' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
    expect(submitMock).toHaveBeenCalledWith({ email: 'amara@example.com', message: 'Please look again' });
  });

  it('needs a usable email and a message', async () => {
    expect((await post({ email: 'nope', message: 'Hi' })).status).toBe(400);
    expect((await post({ email: 'amara@example.com', message: '   ' })).status).toBe(400);
    expect((await post({ email: 'amara@example.com' })).status).toBe(400);
    expect((await post('not json')).status).toBe(400);
    expect((await post({ email: 'amara@example.com', message: 'x'.repeat(2001) })).status).toBe(400);

    expect(submitMock).not.toHaveBeenCalled();
  });

  it('gives the same answer whether or not the address is suspended', async () => {
    // submitAppeal quietly stores nothing for an unknown address
    const response = await post({ email: 'nobody@example.com', message: 'Hello' });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it('reports a failure when the appeal cannot be stored', async () => {
    submitMock.mockRejectedValue(new Error('db down'));

    const response = await post({ email: 'amara@example.com', message: 'Please look again' });

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to send your appeal right now.' });
  });
});
