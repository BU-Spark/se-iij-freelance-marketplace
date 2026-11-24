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
