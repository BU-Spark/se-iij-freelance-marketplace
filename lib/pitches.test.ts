/**
 * @jest-environment node
 */
import { db } from './db';
import {
  canEditPitch,
  canViewPitch,
  createPitch,
  findEditorByEmail,
  getPitch,
  listPitchesForEditor,
  listPitchesForFreelancer,
  loadPitchViewer,
  saveFeedback,
  setPitchStatus,
  toPitch,
  type PitchRow,
  type PitchViewer,
} from './pitches';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const PITCH_ID = '11111111-2222-3333-4444-555555555555';
const FREELANCER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const EDITOR_ID = '99999999-8888-7777-6666-555555555555';

const row: PitchRow = {
  id: PITCH_ID,
  freelancer_user_id: FREELANCER_ID,
  target_editor_user_id: EDITOR_ID,
  slug: 'shadow-budget-city-hall',
  category: 'Reporting/Writing',
  tags: ['City Hall'],
  summary: 'The council routed money through a shell contractor.',
  description: 'Sources: named councillor + FOI documents.',
  location: 'London',
  length: '2,000 words / 3 weeks',
  deadline: 'Three weeks from greenlight',
  compensation: '$2,200 flat',
  status: 'new',
  feedback: null,
  feedback_at: null,
  submitted_at: new Date('2026-11-01T09:00:00.000Z'),
  created_at: new Date('2026-11-01T09:00:00.000Z'),
  updated_at: new Date('2026-11-01T09:00:00.000Z'),
  freelancer_name: 'Marcus Thorne',
};

const editorViewer: PitchViewer = { userId: EDITOR_ID, roles: ['editor'] };
const authorViewer: PitchViewer = { userId: FREELANCER_ID, roles: ['freelancer'] };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('toPitch', () => {
  it('maps a joined row onto the inbox model', () => {
    expect(toPitch(row)).toEqual({
      id: PITCH_ID,
      slug: 'shadow-budget-city-hall',
      category: 'Reporting/Writing',
      tags: ['City Hall'],
      freelancer: { id: FREELANCER_ID, name: 'Marcus Thorne' },
      submittedAt: new Date('2026-11-01T09:00:00.000Z'),
      status: 'new',
      summary: 'The council routed money through a shell contractor.',
      location: 'London',
      length: '2,000 words / 3 weeks',
      deadline: 'Three weeks from greenlight',
      rate: '$2,200 flat',
      description: 'Sources: named councillor + FOI documents.',
    });
  });

  it('treats a null tags column as an empty list', () => {
    const pitch = toPitch({ ...row, tags: null as unknown as string[] });
    expect(pitch.tags).toEqual([]);
  });
});

describe('listPitchesForEditor', () => {
  it('scopes to the editor inbox, newest first', async () => {
    queryMock.mockResolvedValue({ rows: [row] });

    const pitches = await listPitchesForEditor(EDITOR_ID);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('FROM pitches p');
    expect(sql).toContain('p.target_editor_user_id = $1');
    expect(sql).toContain('ORDER BY p.submitted_at DESC');
    expect(queryMock.mock.calls[0][1]).toEqual([EDITOR_ID]);
    expect(pitches).toHaveLength(1);
    expect(pitches[0].freelancer.name).toBe('Marcus Thorne');
  });
});

describe('listPitchesForFreelancer', () => {
  it('scopes to the freelancer who sent them', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    await listPitchesForFreelancer(FREELANCER_ID);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('p.freelancer_user_id = $1');
    expect(queryMock.mock.calls[0][1]).toEqual([FREELANCER_ID]);
  });
});

describe('getPitch', () => {
  it('reads one pitch by id', async () => {
    queryMock.mockResolvedValue({ rows: [row] });

    await expect(getPitch(PITCH_ID)).resolves.toEqual(row);
    expect(queryMock.mock.calls[0][1]).toEqual([PITCH_ID]);
  });

  it('returns null for a non-UUID id without touching the database', async () => {
    await expect(getPitch('shadow-budget')).resolves.toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('visibility', () => {
  it('lets the receiving editor and the sending freelancer read the pitch', () => {
    expect(canViewPitch(editorViewer, row)).toBe(true);
    expect(canViewPitch(authorViewer, row)).toBe(true);
  });

  it('keeps everyone else out', () => {
    expect(canViewPitch({ userId: 'someone-else', roles: ['editor'] }, row)).toBe(false);
    expect(canViewPitch(null, row)).toBe(false);
  });

  it('only lets an editor who received it change it', () => {
    expect(canEditPitch(editorViewer, row)).toBe(true);
    // the freelancer can read their own pitch but not move its status
    expect(canEditPitch(authorViewer, row)).toBe(false);
  });
});

describe('loadPitchViewer', () => {
  it('returns the person id and roles', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: EDITOR_ID, roles: ['editor'] }] });
    await expect(loadPitchViewer('user_123')).resolves.toEqual(editorViewer);
  });

  it('returns null before onboarding', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await expect(loadPitchViewer('user_123')).resolves.toBeNull();
  });
});

describe('findEditorByEmail', () => {
  it('matches an editor case-insensitively and trims the address', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: EDITOR_ID }] });

    await expect(findEditorByEmail('  Editor@News.test ')).resolves.toBe(EDITOR_ID);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain("'editor' = ANY(roles)");
    expect(sql).toContain('lower(email) = lower($1)');
    expect(queryMock.mock.calls[0][1]).toEqual(['Editor@News.test']);
  });

  it('returns null when no editor has that email', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await expect(findEditorByEmail('nobody@news.test')).resolves.toBeNull();
  });
});

describe('createPitch', () => {
  const draft = {
    targetEditorUserId: EDITOR_ID,
    slug: 'shadow-budget-city-hall',
    category: 'Reporting/Writing',
    summary: 'The council routed money through a shell contractor.',
    description: 'Sources: named councillor + FOI documents.',
    location: 'London',
    length: '2,000 words / 3 weeks',
    deadline: 'Three weeks from greenlight',
    compensation: '$2,200 flat',
  };

  it('inserts the pitch and reads it back with the author name', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: PITCH_ID }] }).mockResolvedValueOnce({ rows: [row] });

    const pitch = await createPitch(FREELANCER_ID, draft);

    expect(pitch?.id).toBe(PITCH_ID);
    const insertSql = String(queryMock.mock.calls[0][0]);
    expect(insertSql).toContain('INSERT INTO pitches');
    expect(queryMock.mock.calls[0][1]).toEqual([
      FREELANCER_ID,
      EDITOR_ID,
      draft.slug,
      draft.category,
      [], // no tags collected by the composer yet
      draft.summary,
      draft.description,
      draft.location,
      draft.length,
      draft.deadline,
      draft.compensation,
    ]);
    // second call is the read-back
    expect(String(queryMock.mock.calls[1][0])).toContain('WHERE p.id = $1');
  });

  it('returns null when the same slug was already sent to this editor', async () => {
    queryMock.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: '23505' }));

    await expect(createPitch(FREELANCER_ID, draft)).resolves.toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('rethrows any other database failure', async () => {
    queryMock.mockRejectedValueOnce(new Error('db down'));

    await expect(createPitch(FREELANCER_ID, draft)).rejects.toThrow('db down');
  });
});

describe('setPitchStatus', () => {
  it('updates the status and reports whether a row changed', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });

    await expect(setPitchStatus(PITCH_ID, 'reviewed')).resolves.toBe(true);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('UPDATE pitches');
    expect(sql).toContain('SET status = $2');
    expect(queryMock.mock.calls[0][1]).toEqual([PITCH_ID, 'reviewed']);
  });

  it('returns false for an unknown id', async () => {
    queryMock.mockResolvedValue({ rowCount: 0 });
    await expect(setPitchStatus(PITCH_ID, 'reviewed')).resolves.toBe(false);
  });

  it('skips the database for a non-UUID id', async () => {
    await expect(setPitchStatus('nope', 'reviewed')).resolves.toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('saveFeedback', () => {
  it('stores the notes and moves the pitch to the matching status', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });

    const feedback = {
      decision: 'rejected' as const,
      comments: 'Too thin',
      strengths: '',
      improvements: 'Add sources',
    };
    await expect(saveFeedback(PITCH_ID, feedback)).resolves.toBe(true);

    const sql = String(queryMock.mock.calls[0][0]);
    expect(sql).toContain('feedback = $2::jsonb');
    expect(queryMock.mock.calls[0][1]).toEqual([PITCH_ID, JSON.stringify(feedback), 'declined']);
  });

  it('maps a revision request to negotiating', async () => {
    queryMock.mockResolvedValue({ rowCount: 1 });

    await saveFeedback(PITCH_ID, { decision: 'revision_requested', comments: '', strengths: '', improvements: '' });

    expect(queryMock.mock.calls[0][1][2]).toBe('negotiating');
  });
});
