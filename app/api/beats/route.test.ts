/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { listBeats } from '../../../lib/beats';
import { GET } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/beats', () => ({ listBeats: jest.fn() }));

const authMock = auth as unknown as jest.Mock;
const listMock = listBeats as unknown as jest.Mock;
const consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});

afterAll(() => consoleMock.mockRestore());

beforeEach(() => {
  jest.clearAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-1' });
  listMock.mockResolvedValue([
    { id: 'b1', name: 'Politics', sortOrder: 0 },
    { id: 'b2', name: 'Housing', sortOrder: 1 },
  ]);
});

describe('GET /api/beats', () => {
  it('refuses anonymous callers', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(listMock).not.toHaveBeenCalled();
  });

  it('returns the beat names in picker order', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ beats: ['Politics', 'Housing'] });
  });

  it('reports a failure when the beats cannot be read', async () => {
    listMock.mockRejectedValue(new Error('db down'));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Unable to load the beats right now.' });
  });
});
