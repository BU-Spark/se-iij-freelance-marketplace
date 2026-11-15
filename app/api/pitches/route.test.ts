/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import {
  createPitch,
  findEditorByEmail,
  listPitchesForEditor,
  listPitchesForFreelancer,
  loadPitchViewer,
} from '../../../lib/pitches';
import { GET, POST } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../lib/pitches', () => ({
  loadPitchViewer: jest.fn(),
  listPitchesForEditor: jest.fn(),
  listPitchesForFreelancer: jest.fn(),
  findEditorByEmail: jest.fn(),
  createPitch: jest.fn(),
}));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadPitchViewer as jest.Mock;
const receivedMock = listPitchesForEditor as jest.Mock;
const sentMock = listPitchesForFreelancer as jest.Mock;
const editorByEmailMock = findEditorByEmail as jest.Mock;
const createPitchMock = createPitch as jest.Mock;

const freelancer = { userId: 'user-freelancer', roles: ['freelancer'] };
const editor = { userId: 'user-editor', roles: ['editor'] };

// Passed straight back to the caller, so only the identifying fields matter here
const pitch = { id: 'pitch-1', slug: 'shadow-budget', status: 'new' };

const draft = {
  title: 'Shadow budget in city hall',
  editorEmail: 'editor@news.test',
  category: 'Reporting/Writing',
  summary: 'The council routed money through a shell contractor.',
  description: 'Sources: named councillor + FOI documents.',
  location: 'London',
  length: '2,000 words',
  deadline: '2099-01-01',
  compensation: { amount: '2200', currency: 'USD', unit: 'flat' },
};

const get = (url = 'http://localhost/api/pitches') => GET(new Request(url));

const post = (body: unknown) =>
  new Request('http://localhost/api/pitches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.resetAllMocks();
});

describe('GET /api/pitches', () => {
  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await get();

    expect(response.status).toBe(401);
    expect(receivedMock).not.toHaveBeenCalled();
  });

  it('gives an editor the pitches sent to them by default', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-editor' });
    viewerMock.mockResolvedValue(editor);
    receivedMock.mockResolvedValue([pitch]);

    const response = await get();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(receivedMock).toHaveBeenCalledWith('user-editor');
    expect(sentMock).not.toHaveBeenCalled();
    expect(json.items).toHaveLength(1);
  });

  it('gives an editor their own sent pitches when asked for the sent scope', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-editor' });
    viewerMock.mockResolvedValue({ userId: 'user-editor', roles: ['editor', 'freelancer'] });
    sentMock.mockResolvedValue([]);

    await get('http://localhost/api/pitches?scope=sent');

    expect(sentMock).toHaveBeenCalledWith('user-editor');
    expect(receivedMock).not.toHaveBeenCalled();
  });

  it('gives a freelancer the pitches they sent', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-freelancer' });
    viewerMock.mockResolvedValue(freelancer);
    sentMock.mockResolvedValue([pitch]);

    const response = await get();
    const json = await response.json();

    expect(sentMock).toHaveBeenCalledWith('user-freelancer');
    expect(json.items).toHaveLength(1);
  });

  it('returns an empty list before onboarding', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-new' });
    viewerMock.mockResolvedValue(null);

    const response = await get();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ items: [] });
  });
});

describe('POST /api/pitches', () => {
  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await POST(post(draft));

    expect(response.status).toBe(401);
    expect(createPitchMock).not.toHaveBeenCalled();
  });

  it('reports the same field errors the composer shows', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-freelancer' });

    const response = await POST(post({ ...draft, title: '', editorEmail: 'nope' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.errors).toMatchObject({
      title: expect.any(String),
      editorEmail: expect.any(String),
    });
    expect(createPitchMock).not.toHaveBeenCalled();
  });

  it('asks the caller to finish onboarding first', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-new' });
    viewerMock.mockResolvedValue(null);

    const response = await POST(post(draft));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe('onboarding_required');
  });

  it('refuses to send from an editor-only workspace', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-editor' });
    viewerMock.mockResolvedValue(editor);

    const response = await POST(post(draft));

    expect(response.status).toBe(403);
    expect(editorByEmailMock).not.toHaveBeenCalled();
  });

  it('explains when no editor has that email', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-freelancer' });
    viewerMock.mockResolvedValue(freelancer);
    editorByEmailMock.mockResolvedValue(null);

    const response = await POST(post(draft));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.errors.editorEmail).toMatch(/could not find an editor/i);
    expect(createPitchMock).not.toHaveBeenCalled();
  });

  it('saves the pitch with a slug and a readable rate', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-freelancer' });
    viewerMock.mockResolvedValue(freelancer);
    editorByEmailMock.mockResolvedValue('user-editor');
    createPitchMock.mockResolvedValue(pitch);

    const response = await POST(post(draft));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.pitch.id).toBe('pitch-1');
    expect(createPitchMock).toHaveBeenCalledWith('user-freelancer', {
      targetEditorUserId: 'user-editor',
      slug: 'shadow-budget-in-city-hall',
      category: 'Reporting/Writing',
      summary: 'The council routed money through a shell contractor.',
      description: 'Sources: named councillor + FOI documents.',
      location: 'London',
      length: '2,000 words',
      deadline: '2099-01-01',
      compensation: 'USD 2200 / flat',
    });
  });

  it('treats a repeat send of the same idea as a conflict', async () => {
    authMock.mockResolvedValue({ userId: 'clerk-freelancer' });
    viewerMock.mockResolvedValue(freelancer);
    editorByEmailMock.mockResolvedValue('user-editor');
    createPitchMock.mockResolvedValue(null);

    const response = await POST(post(draft));

    expect(response.status).toBe(409);
  });
});
