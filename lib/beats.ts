import { db } from './db';
import type { Beat } from '../app/types/admin.types';

/** Long enough for "Government Accountability", short enough to stay readable as a chip */
export const MAX_BEAT_NAME_LENGTH = 60;

type BeatRow = {
  id: string;
  name: string;
  sort_order: number;
};

const BEAT_COLUMNS = 'id, name, sort_order';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const toBeat = (row: BeatRow): Beat => ({
  id: row.id,
  name: row.name,
  sortOrder: row.sort_order,
});

/** Every beat onboarding offers, in the order the picker shows them */
export async function listBeats(): Promise<Beat[]> {
  const result = await db.query<BeatRow>(
    `SELECT ${BEAT_COLUMNS}
       FROM beats
      ORDER BY sort_order, name`
  );

  return result.rows.map(toBeat);
}

export type AddBeatResult = { status: 'added'; beat: Beat } | { status: 'exists' };

/**
 * Appends a beat to the end of the picker. The unique index ignores case, so adding a beat that is
 * already offered (however it is capitalised) reports `exists` instead of creating a duplicate.
 */
export async function addBeat(name: string): Promise<AddBeatResult> {
  const result = await db.query<BeatRow>(
    `INSERT INTO beats (name, sort_order)
     SELECT $1, COALESCE(MAX(sort_order) + 1, 0)
       FROM beats
     ON CONFLICT ((LOWER(name))) DO NOTHING
     RETURNING ${BEAT_COLUMNS}`,
    [name]
  );

  const row = result.rows[0];
  return row ? { status: 'added', beat: toBeat(row) } : { status: 'exists' };
}

/** Takes a beat out of the onboarding picker; people who already picked it keep it on their profile */
export async function removeBeat(id: string): Promise<boolean> {
  if (!UUID_PATTERN.test(id)) return false;

  const result = await db.query(`DELETE FROM beats WHERE id = $1 RETURNING id`, [id]);
  return result.rows.length > 0;
}

export type MoveDirection = 'up' | 'down';

export type MoveBeatResult = { status: 'moved'; beats: Beat[] } | { status: 'not-found' };

export const isMoveDirection = (value: unknown): value is MoveDirection => value === 'up' || value === 'down';

/**
 * Swaps a beat with its neighbour so the onboarding picker shows it one place earlier or later.
 * The whole list is locked and renumbered inside one transaction, so two admins moving at once
 * cannot leave duplicate order values behind. Moving the first beat up or the last one down is a
 * no-op that still returns the current list.
 */
export async function moveBeat(id: string, direction: MoveDirection): Promise<MoveBeatResult> {
  if (!UUID_PATTERN.test(id)) return { status: 'not-found' };

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query<{ id: string }>(
      `SELECT id
         FROM beats
        ORDER BY sort_order, name
          FOR UPDATE`
    );
    const ids = result.rows.map((row) => row.id);
    const index = ids.indexOf(id);

    if (index < 0) {
      await client.query('ROLLBACK');
      return { status: 'not-found' };
    }

    const target = direction === 'up' ? index - 1 : index + 1;

    if (target >= 0 && target < ids.length) {
      [ids[index], ids[target]] = [ids[target], ids[index]];

      // Renumber every row, which also repairs any equal sort_order values left by older adds
      await client.query(
        `UPDATE beats AS b
            SET sort_order = ordered.position
           FROM (
             SELECT id, (ordinality - 1)::int AS position
               FROM unnest($1::uuid[]) WITH ORDINALITY AS moved(id, ordinality)
           ) AS ordered
          WHERE b.id = ordered.id`,
        [ids]
      );
    }

    await client.query('COMMIT');
    return { status: 'moved', beats: await listBeats() };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      // a broken connection cannot roll back; report the original failure instead of hiding it
      console.error('Could not roll back the beat move.', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
