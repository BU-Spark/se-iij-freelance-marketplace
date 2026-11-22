/**
 * @jest-environment node
 */
import { db } from './db';
import { addBeat, listBeats, removeBeat } from './beats';

jest.mock('./db', () => ({ db: { query: jest.fn() } }));

const queryMock = db.query as jest.Mock;

const BEAT_ID = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  queryMock.mockReset();
});

describe('listBeats', () => {
  it('maps rows to the shape the admin tab uses', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: BEAT_ID, name: 'Politics', sort_order: 3 }] });

    expect(await listBeats()).toEqual([{ id: BEAT_ID, name: 'Politics', sortOrder: 3 }]);
    expect(queryMock.mock.calls[0][0]).toContain('ORDER BY sort_order');
  });

  it('returns an empty list when nothing is offered', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    expect(await listBeats()).toEqual([]);
  });
});

describe('addBeat', () => {
  it('returns the beat the database appended', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: BEAT_ID, name: 'Water rights', sort_order: 42 }] });

    expect(await addBeat('Water rights')).toEqual({
      status: 'added',
      beat: { id: BEAT_ID, name: 'Water rights', sortOrder: 42 },
    });
    // the name is the only value sent; the order is computed in SQL so two adds cannot collide
    expect(queryMock.mock.calls[0][1]).toEqual(['Water rights']);
    expect(queryMock.mock.calls[0][0]).toContain('MAX(sort_order) + 1');
  });

  it('reports a beat that is already offered instead of creating a duplicate', async () => {
    queryMock.mockResolvedValue({ rows: [] });

    expect(await addBeat('politics')).toEqual({ status: 'exists' });
  });
});

describe('removeBeat', () => {
  it('deletes the beat and reports whether it existed', async () => {
    queryMock.mockResolvedValue({ rows: [{ id: BEAT_ID }] });

    expect(await removeBeat(BEAT_ID)).toBe(true);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM beats'), [BEAT_ID]);

    queryMock.mockResolvedValue({ rows: [] });
    expect(await removeBeat(BEAT_ID)).toBe(false);
  });

  it('does not query for an id that cannot be a beat', async () => {
    expect(await removeBeat('not-a-uuid')).toBe(false);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
