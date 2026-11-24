/**
 * @jest-environment node
 */
import { db } from './db';
import { addBeat, listBeats, moveBeat, removeBeat } from './beats';

jest.mock('./db', () => ({ db: { query: jest.fn(), connect: jest.fn() } }));

const queryMock = db.query as jest.Mock;
const connectMock = db.connect as unknown as jest.Mock;

/** The transaction client `moveBeat` borrows from the pool */
const client = { query: jest.fn(), release: jest.fn() };

const BEAT_ID = '11111111-1111-4111-8111-111111111111';
const FIRST_ID = '22222222-2222-4222-8222-222222222222';
const LAST_ID = '33333333-3333-4333-8333-333333333333';

beforeEach(() => {
  queryMock.mockReset();
  client.query.mockReset();
  client.release.mockReset();
  connectMock.mockReset();
  connectMock.mockResolvedValue(client);
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

describe('moveBeat', () => {
  /** Answer the transaction in order: BEGIN, the ordered ids, then whatever follows */
  const openTransaction = (ids: string[]) => {
    client.query.mockResolvedValueOnce({});
    client.query.mockResolvedValueOnce({ rows: ids.map((id) => ({ id })) });
  };

  const listed = [
    { id: FIRST_ID, name: 'Politics', sort_order: 0 },
    { id: BEAT_ID, name: 'Housing', sort_order: 1 },
    { id: LAST_ID, name: 'Tech', sort_order: 2 },
  ];

  it('swaps the beat with the one above it and renumbers the list', async () => {
    openTransaction([FIRST_ID, BEAT_ID, LAST_ID]);
    client.query.mockResolvedValueOnce({}); // UPDATE
    client.query.mockResolvedValueOnce({}); // COMMIT
    queryMock.mockResolvedValue({ rows: listed });

    expect(await moveBeat(BEAT_ID, 'up')).toEqual({
      status: 'moved',
      beats: listed.map((row, index) => ({ id: row.id, name: row.name, sortOrder: index })),
    });

    const update = client.query.mock.calls.find(([sql]) => String(sql).includes('UPDATE beats'));
    expect(update?.[1]).toEqual([[BEAT_ID, FIRST_ID, LAST_ID]]);
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('moves a beat down past the one below it', async () => {
    openTransaction([FIRST_ID, BEAT_ID, LAST_ID]);
    client.query.mockResolvedValueOnce({});
    client.query.mockResolvedValueOnce({});
    queryMock.mockResolvedValue({ rows: listed });

    await moveBeat(BEAT_ID, 'down');

    const update = client.query.mock.calls.find(([sql]) => String(sql).includes('UPDATE beats'));
    expect(update?.[1]).toEqual([[FIRST_ID, LAST_ID, BEAT_ID]]);
  });

  it('leaves the order alone at either end', async () => {
    openTransaction([FIRST_ID, BEAT_ID, LAST_ID]);
    client.query.mockResolvedValueOnce({}); // COMMIT
    queryMock.mockResolvedValue({ rows: listed });

    expect((await moveBeat(FIRST_ID, 'up')).status).toBe('moved');

    openTransaction([FIRST_ID, BEAT_ID, LAST_ID]);
    client.query.mockResolvedValueOnce({}); // COMMIT
    await moveBeat(LAST_ID, 'down');

    expect(client.query.mock.calls.some(([sql]) => String(sql).includes('UPDATE beats'))).toBe(false);
    expect(client.query).not.toHaveBeenCalledWith('ROLLBACK');
  });

  it('rolls back and reports a beat that is no longer there', async () => {
    openTransaction([FIRST_ID]);

    expect(await moveBeat(BEAT_ID, 'up')).toEqual({ status: 'not-found' });
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(queryMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalled();
  });

  it('does not open a transaction for an id that cannot be a beat', async () => {
    expect(await moveBeat('not-a-uuid', 'up')).toEqual({ status: 'not-found' });
    expect(connectMock).not.toHaveBeenCalled();
  });

  it('rolls back and rethrows when the swap fails', async () => {
    openTransaction([FIRST_ID, BEAT_ID]);
    client.query.mockRejectedValueOnce(new Error('db down')); // UPDATE

    await expect(moveBeat(BEAT_ID, 'up')).rejects.toThrow('db down');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
