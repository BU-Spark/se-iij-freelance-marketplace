/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import middleware from './middleware';

// Expose the handler so it can be called directly with a stubbed auth()
jest.mock('@clerk/nextjs/server', () => ({
  ...jest.requireActual('@clerk/nextjs/server'),
  clerkMiddleware: (handler: unknown) => handler,
  clerkClient: jest.fn().mockResolvedValue({
    users: { getUser: jest.fn().mockResolvedValue({ publicMetadata: {} }) },
  }),
}));

type Handler = (auth: () => Promise<{ userId: string | null }>, request: NextRequest) => Promise<Response | undefined>;

const callMiddleware = async (path: string, userId: string | null) => {
  const request = new NextRequest(new URL(path, 'http://localhost'));
  const auth = jest.fn().mockResolvedValue({ userId });
  const response = await (middleware as unknown as Handler)(auth, request);
  return { response, auth };
};

describe('middleware protected routes', () => {
  it('sends signed-out visitors to our own login page', async () => {
    const { response, auth } = await callMiddleware('/dashboard', null);

    expect(response?.status).toBe(307);
    expect(response?.headers.get('location')).toBe('http://localhost/login');
    expect(auth).toHaveBeenCalled();
  });

  it('leaves signed-in visitors on the dashboard', async () => {
    const { response } = await callMiddleware('/dashboard', 'user_123');

    expect(response).toBeUndefined();
  });
});
