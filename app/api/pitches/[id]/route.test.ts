/**
 * @jest-environment node
 */
import { auth } from '@clerk/nextjs/server';
import { canEditPitch, getPitch, loadPitchViewer, saveFeedback, setPitchStatus } from '../../../../lib/pitches';
import { PATCH } from './route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('../../../../lib/pitches', () => ({
  loadPitchViewer: jest.fn(),
  getPitch: jest.fn(),
  canEditPitch: jest.fn(),
  saveFeedback: jest.fn(),
  setPitchStatus: jest.fn(),
  STATUS_FOR_DECISION: {
    accepted: 'accepted',
    rejected: 'declined',
    revision_requested: 'negotiating',
  },
}));

const authMock = auth as unknown as jest.Mock;
const viewerMock = loadPitchViewer as jest.Mock;
const getPitchMock = getPitch as jest.Mock;
const canEditMock = canEditPitch as jest.Mock;
const saveFeedbackMock = saveFeedback as jest.Mock;
const setStatusMock = setPitchStatus as jest.Mock;

const PITCH_ID = '11111111-2222-3333-4444-555555555555';
const editor = { userId: 'user-editor', roles: ['editor'] };
const pitch = { id: PITCH_ID, target_editor_user_id: 'user-editor' };

const feedback = {
  decision: 'rejected',
  comments: 'Too thin on sources.',
  strengths: 'Clear angle.',
  improvements: 'Add two named sources.',
};

const patch = (body: unknown) =>
  PATCH(
    new Request(`http://localhost/api/pitches/${PITCH_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: PITCH_ID }) }
  );

beforeEach(() => {
  jest.resetAllMocks();
  authMock.mockResolvedValue({ userId: 'clerk-editor' });
  viewerMock.mockResolvedValue(editor);
  getPitchMock.mockResolvedValue(pitch);
  canEditMock.mockReturnValue(true);
  saveFeedbackMock.mockResolvedValue(true);
  setStatusMock.mockResolvedValue(true);
});

describe('PATCH /api/pitches/[id]', () => {
  it('rejects anonymous requests', async () => {
    authMock.mockResolvedValue({ userId: null });

    const response = await patch({ status: 'reviewed' });

    expect(response.status).toBe(401);
    expect(getPitchMock).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const response = await PATCH(
      new Request(`http://localhost/api/pitches/${PITCH_ID}`, { method: 'PATCH', body: 'nope' }),
      { params: Promise.resolve({ id: PITCH_ID }) }
    );

    expect(response.status).toBe(400);
  });

  it('hides a pitch the caller may not edit behind a 404', async () => {
    canEditMock.mockReturnValue(false);

    const response = await patch({ status: 'reviewed' });

    expect(response.status).toBe(404);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('hides a missing pitch behind a 404', async () => {
    getPitchMock.mockResolvedValue(null);

    const response = await patch({ status: 'reviewed' });

    expect(response.status).toBe(404);
  });

  it('moves the pitch to a valid status', async () => {
    const response = await patch({ status: 'reviewed' });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ id: PITCH_ID, status: 'reviewed' });
    expect(setStatusMock).toHaveBeenCalledWith(PITCH_ID, 'reviewed');
  });

  it('refuses a status the database would reject', async () => {
    const response = await patch({ status: 'archived' });

    expect(response.status).toBe(400);
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('saves feedback and reports the status the decision implies', async () => {
    const response = await patch({ feedback });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ id: PITCH_ID, status: 'declined' });
    expect(saveFeedbackMock).toHaveBeenCalledWith(PITCH_ID, feedback);
    // saveFeedback already moves the status, so the two must not both run
    expect(setStatusMock).not.toHaveBeenCalled();
  });

  it('refuses feedback with an unknown decision', async () => {
    const response = await patch({ feedback: { ...feedback, decision: 'maybe' } });

    expect(response.status).toBe(400);
    expect(saveFeedbackMock).not.toHaveBeenCalled();
  });

  it('refuses feedback with missing notes', async () => {
    const response = await patch({ feedback: { decision: 'accepted', comments: '' } });

    expect(response.status).toBe(400);
    expect(saveFeedbackMock).not.toHaveBeenCalled();
  });

  it('reports a pitch that disappeared between the read and the write', async () => {
    setStatusMock.mockResolvedValue(false);

    const response = await patch({ status: 'accepted' });

    expect(response.status).toBe(404);
  });

  it('reports an unexpected database failure', async () => {
    getPitchMock.mockRejectedValue(new Error('db down'));

    const response = await patch({ status: 'reviewed' });

    expect(response.status).toBe(500);
  });
});
